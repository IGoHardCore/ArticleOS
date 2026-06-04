import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateChatStream } from '@/lib/ai';
import { db } from '@/lib/db';
import { checkRateLimit } from '@/lib/ratelimit';

const MAX_MESSAGE_LENGTH = 8000;
const CHAT_RATE_LIMIT = { maxRequests: 20, windowMs: 60_000 };

async function buildArticleContext(userId: string): Promise<string> {
  try {
    const [{ data: bookmarkData }, { data: ratingData }] = await Promise.all([
      db.from('bookmarks').select('article_id').eq('clerk_user_id', userId),
      db.from('ratings').select('article_id, rating').eq('clerk_user_id', userId).gte('rating', 3),
    ]);
    const ids = [...new Set([
      ...(bookmarkData ?? []).map((b: { article_id: number }) => b.article_id),
      ...(ratingData ?? []).map((r: { article_id: number }) => r.article_id),
    ])].slice(0, 20);
    if (!ids.length) return '';

    const { data: articlesData } = await db.from('articles').select('id, title, source, summary').in('id', ids);
    const ratingMap = new Map((ratingData ?? []).map((r: { article_id: number; rating: number }) => [r.article_id, r.rating]));
    const bookmarkSet = new Set((bookmarkData ?? []).map((b: { article_id: number }) => b.article_id));

    return (articlesData ?? []).map((a: { id: number; title: string; source: string | null; summary: string | null }) => {
      const rating = ratingMap.get(a.id);
      const label = rating ? ` (rated ${rating}/5)` : bookmarkSet.has(a.id) ? ' (bookmarked)' : '';
      const snippet = a.summary ? a.summary.split('\n\n')[0].slice(0, 150) : '';
      return `- "${a.title}"${a.source ? ` [${a.source}]` : ''}${label}${snippet ? ': ' + snippet : ''}`;
    }).join('\n');
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
    const articleContext = await buildArticleContext(userId);
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
