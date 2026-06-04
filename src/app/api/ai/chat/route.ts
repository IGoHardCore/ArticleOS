import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateChatStream } from '@/lib/ai';
import { sql } from '@/lib/db';
import { checkRateLimit } from '@/lib/ratelimit';

const MAX_MESSAGE_LENGTH = 8000;
const CHAT_RATE_LIMIT = { maxRequests: 20, windowMs: 60_000 };

async function buildArticleContext(userId: string): Promise<string> {
  try {
    const articles = await sql<{ title: string; source: string | null; summary: string | null; rating: number | null }[]>`
      SELECT DISTINCT a.title, a.source, a.summary, r.rating
      FROM articles a
      LEFT JOIN ratings r ON r.article_id = a.id AND r.clerk_user_id = ${userId}
      LEFT JOIN bookmarks b ON b.article_id = a.id AND b.clerk_user_id = ${userId}
      WHERE b.clerk_user_id IS NOT NULL OR r.rating >= 3
      ORDER BY r.rating DESC NULLS LAST, a.published_at DESC NULLS LAST
      LIMIT 20
    `;

    if (!articles.length) return '';
    return articles.map(a => {
      const rating = a.rating ? ` (rated ${a.rating}/5)` : ' (bookmarked)';
      const snippet = a.summary ? a.summary.split('\n\n')[0].slice(0, 150) : '';
      return `- "${a.title}"${a.source ? ` [${a.source}]` : ''}${rating}${snippet ? ': ' + snippet : ''}`;
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
