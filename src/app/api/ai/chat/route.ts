import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateChatStream } from '@/lib/ai';
import { db } from '@/lib/db';
import { checkRateLimit } from '@/lib/ratelimit';

const MAX_MESSAGE_LENGTH = 8000;
const CHAT_RATE_LIMIT = { maxRequests: 20, windowMs: 60_000 };

async function buildUserProfile(userId: string): Promise<string> {
  try {
    const [{ data: allRatings }, { data: bookmarkData }] = await Promise.all([
      db.from('ratings').select('article_id, rating, created_at').eq('clerk_user_id', userId),
      db.from('bookmarks').select('article_id').eq('clerk_user_id', userId),
    ]);

    const ratings = (allRatings ?? []) as { article_id: number; rating: number; created_at: string }[];
    const bookmarks = (bookmarkData ?? []) as { article_id: number }[];

    if (!ratings.length && !bookmarks.length) return '';

    // Compute reading stats
    const avgRating = ratings.length
      ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1)
      : null;
    const stronglyLiked = ratings.filter(r => r.rating >= 4).length;
    const skipped = ratings.filter(r => r.rating <= 2).length;

    // Get tags for highly-rated articles to infer interests
    const likedIds = ratings.filter(r => r.rating >= 4).map(r => r.article_id);
    const skippedIds = ratings.filter(r => r.rating <= 2).map(r => r.article_id);

    const [{ data: likedTagLinks }, { data: skippedTagLinks }] = await Promise.all([
      likedIds.length ? db.from('article_tags').select('tags(name)').in('article_id', likedIds) : Promise.resolve({ data: [] }),
      skippedIds.length ? db.from('article_tags').select('tags(name)').in('article_id', skippedIds) : Promise.resolve({ data: [] }),
    ]);

    const tagCount = new Map<string, number>();
    for (const row of (likedTagLinks ?? []) as { tags: unknown }[]) {
      const t = row.tags as { name: string } | null;
      if (!t) continue;
      tagCount.set(t.name, (tagCount.get(t.name) ?? 0) + 1);
    }
    const topInterests = [...tagCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    const avoidedTagCount = new Map<string, number>();
    for (const row of (skippedTagLinks ?? []) as { tags: unknown }[]) {
      const at = row.tags as { name: string } | null;
      if (!at) continue;
      avoidedTagCount.set(at.name, (avoidedTagCount.get(at.name) ?? 0) + 1);
    }
    const avoidedTopics = [...avoidedTagCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);

    // Recent highly-rated articles for direct context
    const recentLikedIds = ratings
      .filter(r => r.rating >= 4)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map(r => r.article_id);

    const bookmarkIds = bookmarks.map(b => b.article_id).slice(0, 5);
    const contextIds = [...new Set([...recentLikedIds, ...bookmarkIds])].slice(0, 15);

    const { data: articlesData } = contextIds.length
      ? await db.from('articles').select('id, title, source, summary').in('id', contextIds)
      : { data: [] };

    const ratingMap = new Map(ratings.map(r => [r.article_id, r.rating]));
    const bookmarkSet = new Set(bookmarks.map(b => b.article_id));

    const articleLines = (articlesData ?? []).map((a: { id: number; title: string; source: string | null; summary: string | null }) => {
      const rating = ratingMap.get(a.id);
      const label = rating ? ` (rated ${rating}/5)` : bookmarkSet.has(a.id) ? ' (bookmarked)' : '';
      const snippet = a.summary ? a.summary.split('\n\n')[0].slice(0, 120) : '';
      return `  - "${a.title}"${a.source ? ` [${a.source}]` : ''}${label}${snippet ? ': ' + snippet : ''}`;
    });

    const lines: string[] = [
      '--- USER READING PROFILE ---',
      `Articles rated: ${ratings.length} | Bookmarked: ${bookmarks.length} | Average rating: ${avgRating ?? 'n/a'}/5`,
      `Strongly liked (4-5): ${stronglyLiked} | Skipped (1-2): ${skipped}`,
    ];
    if (topInterests.length) lines.push(`Top interests: ${topInterests.join(', ')}`);
    if (avoidedTopics.length) lines.push(`Less interested in: ${avoidedTopics.join(', ')}`);
    if (articleLines.length) {
      lines.push('Recent highly-rated / bookmarked articles:');
      lines.push(...articleLines);
    }
    lines.push('--- END PROFILE ---');

    return lines.join('\n');
  } catch {
    return '';
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

  const { allowed, retryAfterMs } = checkRateLimit(`chat:${userId}`, CHAT_RATE_LIMIT.maxRequests, CHAT_RATE_LIMIT.windowMs);
  if (!allowed) {
    return new Response(JSON.stringify({ error: `Rate limit exceeded. Try again in ${Math.ceil(retryAfterMs / 1000)}s.` }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) },
    });
  }

  const { message, history = [] } = await req.json();
  if (!message?.trim()) return new Response('Empty message', { status: 400 });
  if (message.length > MAX_MESSAGE_LENGTH) {
    return new Response(JSON.stringify({ error: 'Message too long' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  const trimmedHistory = Array.isArray(history) ? history.slice(-20) : [];

  try {
    const articleContext = await buildUserProfile(userId);
    const stream = await generateChatStream(message, trimmedHistory, articleContext, userId);

    const readable = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of stream) {
            controller.enqueue(encoder.encode(chunk));
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'AI request failed';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
