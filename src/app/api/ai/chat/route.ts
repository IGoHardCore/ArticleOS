import { NextRequest, NextResponse } from 'next/server';
import { generateChat } from '@/lib/ai';
import { getDb } from '@/lib/db';

function buildArticleContext(): string {
  try {
    const db = getDb();
    // Pull articles the user has rated 3+ or bookmarked, most recent first
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
      const rating = a.rating ? ` (user rated ${a.rating}/5)` : ' (bookmarked)';
      const summary = a.summary ? a.summary.split('\n\n')[0].slice(0, 200) : '';
      return `- "${a.title}"${a.source ? ` [${a.source}]` : ''}${rating}${summary ? ': ' + summary : ''}`;
    }).join('\n');
  } catch {
    return '';
  }
}

export async function POST(req: NextRequest) {
  const { message, history = [] } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error: 'Empty message' }, { status: 400 });
  try {
    const articleContext = buildArticleContext();
    const response = await generateChat(message, history, articleContext);
    return NextResponse.json({ response });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'AI request failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
