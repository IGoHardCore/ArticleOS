import { NextRequest } from 'next/server';
import { generateChatStream } from '@/lib/ai';
import { getDb } from '@/lib/db';

function buildArticleContext(): string {
  try {
    const db = getDb();
    const articles = db.prepare(`
      SELECT DISTINCT a.title, a.source, a.summary, r.rating
      FROM articles a
      LEFT JOIN ratings r ON r.article_id = a.id
      WHERE a.bookmarked = 1 OR r.rating >= 3
      ORDER BY r.rating DESC, a.published_at DESC
      LIMIT 20
    `).all() as Array<{ title: string; source: string | null; summary: string | null; rating: number | null }>;

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
  const { message, history = [] } = await req.json();
  if (!message?.trim()) return new Response('Empty message', { status: 400 });

  try {
    const articleContext = buildArticleContext();
    const stream = await generateChatStream(message, history, articleContext);

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
