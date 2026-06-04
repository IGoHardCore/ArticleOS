import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';
import { analyzeArticle } from '@/lib/ai';
import { checkRateLimit } from '@/lib/ratelimit';

const SUMMARIZE_RATE_LIMIT = { maxRequests: 10, windowMs: 60_000 };

async function analyzeWithRetry(title: string, text: string, attempts = 4) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await analyzeArticle(title, text);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      const isRateLimit = msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED');
      if (isRateLimit && i < attempts - 1) {
        await new Promise(r => setTimeout(r, 5000 * (i + 1)));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Max retries exceeded');
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { allowed, retryAfterMs } = checkRateLimit(`summarize:${userId}`, SUMMARIZE_RATE_LIMIT.maxRequests, SUMMARIZE_RATE_LIMIT.windowMs);
  if (!allowed) return NextResponse.json({ error: `Rate limit. Try again in ${Math.ceil(retryAfterMs / 1000)}s.` }, { status: 429 });

  const { id } = await params;
  const numId = parseInt(id);
  if (isNaN(numId) || numId <= 0) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const rows = await sql<{ id: number; title: string; full_text: string | null; summary: string | null }[]>`
    SELECT id, title, full_text, summary FROM articles WHERE id = ${numId}
  `;
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const article = rows[0];
  if (article.summary) return NextResponse.json({ summary: article.summary });

  try {
    const result = await analyzeWithRetry(article.title, article.full_text || article.title);
    if (result.summary) {
      await sql`UPDATE articles SET summary = ${result.summary} WHERE id = ${numId}`;
    }
    for (const tagName of result.tags) {
      const tags = await sql<{ id: number }[]>`SELECT id FROM tags WHERE name = ${tagName}`;
      if (tags.length) {
        await sql`INSERT INTO article_tags (article_id, tag_id) VALUES (${numId}, ${tags[0].id}) ON CONFLICT DO NOTHING`;
      }
    }
    return NextResponse.json({ summary: result.summary, tags: result.tags });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
