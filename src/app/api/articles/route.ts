import { NextRequest, NextResponse } from 'next/server';
import { getRecommendedArticles, getLatestArticles, searchArticles, getTopPick } from '@/lib/recommendations';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('mode') || 'recommended';
  const query = searchParams.get('q') || '';
  const tag = searchParams.get('tag') || '';
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    if (query) {
      const articles = searchArticles(query, tag || undefined);
      return NextResponse.json({ articles, total: articles.length });
    }
    if (mode === 'latest') {
      return NextResponse.json({ articles: getLatestArticles(limit, offset) });
    }
    if (mode === 'top-pick') {
      const period = (searchParams.get('period') || 'week') as 'week' | 'month';
      return NextResponse.json({ article: getTopPick(period) });
    }
    if (mode === 'by-tag') {
      const db = getDb();
      const articles = db.prepare(`
        SELECT DISTINCT a.id, a.title, a.url, a.summary, a.source, a.author,
          a.image_url, a.published_at, a.scraped_at,
          AVG(r.rating) AS avg_rating, COUNT(DISTINCT r.id) AS rating_count
        FROM articles a
        LEFT JOIN ratings r ON r.article_id = a.id
        JOIN article_tags at ON at.article_id = a.id
        JOIN tags t ON t.id = at.tag_id
        WHERE t.name = ?
        GROUP BY a.id ORDER BY a.published_at DESC LIMIT ? OFFSET ?
      `).all(tag, limit, offset);
      return NextResponse.json({ articles });
    }
    return NextResponse.json({ articles: getRecommendedArticles(limit, offset) });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to fetch articles' }, { status: 500 });
  }
}
