import { NextResponse } from 'next/server';
import { scrapeFeeds } from '@/lib/scraper';
import { processUnanalyzedArticles } from '@/lib/ai';

export async function POST() {
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
  try {
    const analyzed = await processUnanalyzedArticles(10);
    return NextResponse.json({ analyzed });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Analysis failed' }, { status: 500 });
  }
}
