import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getRecommendedArticles, getLatestArticles, searchArticles, getTopPick } from '@/lib/recommendations';
import { sql } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('mode') || 'recommended';
  const query = searchParams.get('q') || '';
  const tag = searchParams.get('tag') || '';
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    if (query) {
      const articles = await searchArticles(query, tag || undefined);
      return NextResponse.json({ articles, total: articles.length });
    }

    if (mode === 'latest') {
      return NextResponse.json({ articles: await getLatestArticles(limit, offset, userId ?? undefined) });
    }

    if (mode === 'top-pick') {
      const period = (searchParams.get('period') || 'week') as 'week' | 'month';
      return NextResponse.json({ article: await getTopPick(period, userId ?? undefined) });
    }

    if (mode === 'by-tag') {
      const articles = await sql<{ id: number; title: string; url: string; summary: string | null; source: string | null; author: string | null; image_url: string | null; published_at: string | null; scraped_at: string; avg_rating: number; rating_count: number; user_rating: number | null }[]>`
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
        WHERE t.name = ${tag}
        GROUP BY a.id
        ORDER BY a.published_at DESC NULLS LAST
        LIMIT ${limit} OFFSET ${offset}
      `;

      const ids = articles.map(a => Number(a.id));
      const tagRows = ids.length > 0
        ? await sql<{ article_id: number; id: number; name: string; color: string }[]>`
            SELECT at.article_id, t.id, t.name, t.color
            FROM article_tags at JOIN tags t ON t.id = at.tag_id
            WHERE at.article_id = ANY(${sql.array(ids)})
          `
        : [];
      const tagMap = new Map<number, { id: number; name: string; color: string }[]>();
      for (const r of tagRows) {
        const aid = Number(r.article_id);
        if (!tagMap.has(aid)) tagMap.set(aid, []);
        tagMap.get(aid)!.push({ id: Number(r.id), name: r.name, color: r.color });
      }
      return NextResponse.json({ articles: articles.map(a => ({ ...a, id: Number(a.id), tags: tagMap.get(Number(a.id)) || [] })) });
    }

    return NextResponse.json({ articles: await getRecommendedArticles(limit, offset, userId ?? undefined) });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}
