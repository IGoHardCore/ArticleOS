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
        SELECT DISTINCT
          a.id, a.title, a.url, a.summary, a.source, a.author,
          a.image_url, a.published_at, a.scraped_at,
          AVG(r.rating) AS avg_rating,
          COUNT(DISTINCT r.id) AS rating_count,
          MAX(r.rating) AS user_rating
        FROM articles a
        LEFT JOIN ratings r ON r.article_id = a.id
        JOIN article_tags at ON at.article_id = a.id
        JOIN tags t ON t.id = at.tag_id
        WHERE t.name = ?
        GROUP BY a.id
        ORDER BY a.published_at DESC
        LIMIT ? OFFSET ?
      `).all(tag, limit, offset) as { id: number }[];

      const ids = articles.map(a => a.id);
      const tagRows = ids.length > 0
        ? (db.prepare(`
            SELECT at.article_id, t.id, t.name, t.color
            FROM article_tags at JOIN tags t ON t.id = at.tag_id
            WHERE at.article_id IN (${ids.map(() => '?').join(',')})
          `).all(...ids) as { article_id: number; id: number; name: string; color: string }[])
        : [];
      const tagMap = new Map<number, { id: number; name: string; color: string }[]>();
      for (const r of tagRows) {
        if (!tagMap.has(r.article_id)) tagMap.set(r.article_id, []);
        tagMap.get(r.article_id)!.push({ id: r.id, name: r.name, color: r.color });
      }
      return NextResponse.json({ articles: articles.map(a => ({ ...a, tags: tagMap.get(a.id) || [] })) });
    }

    return NextResponse.json({ articles: getRecommendedArticles(limit, offset) });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}
