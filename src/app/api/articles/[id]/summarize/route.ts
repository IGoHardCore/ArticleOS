import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
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

  const { data: articleData } = await db
    .from('articles')
    .select('id, title, full_text, summary')
    .eq('id', numId)
    .maybeSingle();
  if (!articleData) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const article = articleData as { id: number; title: string; full_text: string | null; summary: string | null };
  if (article.summary) return NextResponse.json({ summary: article.summary });

  try {
    const result = await analyzeWithRetry(article.title, article.full_text || article.title);
    if (result.summary) {
      await db.from('articles').update({ summary: result.summary }).eq('id', numId);
    }
    for (const tagName of result.tags) {
      const { data: tagRow } = await db.from('tags').select('id').eq('name', tagName).maybeSingle();
      if (tagRow) {
        await db.from('article_tags').upsert(
          { article_id: numId, tag_id: (tagRow as { id: number }).id },
          { onConflict: 'article_id,tag_id', ignoreDuplicates: true }
        );
      }
    }
    return NextResponse.json({ summary: result.summary, tags: result.tags });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
