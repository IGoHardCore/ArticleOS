import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { scrapeFeeds } from '@/lib/scraper';
import { processUnanalyzedArticles } from '@/lib/ai';
import { checkRateLimit } from '@/lib/ratelimit';

// Allow 1 manual scrape per user per 5 minutes
const SCRAPE_RATE_LIMIT = { maxRequests: 1, windowMs: 5 * 60_000 };

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { allowed, retryAfterMs } = checkRateLimit(`scrape:${userId}`, SCRAPE_RATE_LIMIT.maxRequests, SCRAPE_RATE_LIMIT.windowMs);
  if (!allowed) return NextResponse.json({ error: `Please wait ${Math.ceil(retryAfterMs / 1000)}s before fetching again.` }, { status: 429 });

  try {
    const scrapeResult = await scrapeFeeds();
    let analyzed = 0;
    try {
      analyzed = await processUnanalyzedArticles(30);
    } catch (err) {
      console.error('AI analysis failed:', err);
    }
    return NextResponse.json({ success: true, added: scrapeResult.added, skipped: scrapeResult.skipped, analyzed, errors: scrapeResult.errors });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Scrape failed' }, { status: 500 });
  }
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const analyzed = await processUnanalyzedArticles(10);
    return NextResponse.json({ analyzed });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Analysis failed' }, { status: 500 });
  }
}
