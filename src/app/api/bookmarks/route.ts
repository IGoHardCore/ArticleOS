import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';
import { Article, Tag } from '@/lib/db';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const articles = await sql<(Article & { user_rating?: number })[]>`
    SELECT a.*, r.rating as user_rating
    FROM articles a
    JOIN bookmarks b ON b.article_id = a.id
    LEFT JOIN (
      SELECT article_id, MAX(rating) as rating FROM ratings
      WHERE clerk_user_id = ${userId} GROUP BY article_id
    ) r ON r.article_id = a.id
    WHERE b.clerk_user_id = ${userId}
    ORDER BY b.created_at DESC
  `;

  const ids = articles.map(a => Number(a.id));
  const tagRows = ids.length > 0
    ? await sql<{ article_id: number; id: number; name: string; color: string }[]>`
        SELECT at.article_id, t.id, t.name, t.color FROM tags t
        JOIN article_tags at ON at.tag_id = t.id
        WHERE at.article_id = ANY(${sql.array(ids)})
      `
    : [];
  const tagMap = new Map<number, Tag[]>();
  for (const r of tagRows) {
    const aid = Number(r.article_id);
    if (!tagMap.has(aid)) tagMap.set(aid, []);
    tagMap.get(aid)!.push({ id: Number(r.id), name: r.name, color: r.color });
  }

  const result = articles.map(a => ({
    ...a,
    id: Number(a.id),
    bookmarked: 1,
    tags: tagMap.get(Number(a.id)) || [],
  }));

  return NextResponse.json({ articles: result });
}
