import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDb } from '@/lib/db';
import { Article, Tag } from '@/lib/db';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();

  const articles = db.prepare(`
    SELECT a.*, r.rating as user_rating
    FROM articles a
    JOIN bookmarks b ON b.article_id = a.id
    LEFT JOIN (
      SELECT article_id, MAX(rating) as rating FROM ratings
      WHERE clerk_user_id = ? GROUP BY article_id
    ) r ON r.article_id = a.id
    WHERE b.clerk_user_id = ?
    ORDER BY b.created_at DESC
  `).all(userId, userId) as (Article & { user_rating?: number })[];

  const getTags = db.prepare(`
    SELECT t.id, t.name, t.color FROM tags t
    JOIN article_tags at ON at.tag_id = t.id WHERE at.article_id = ?
  `);

  const result = articles.map(a => ({
    ...a,
    bookmarked: 1,
    tags: getTags.all(a.id) as Tag[],
  }));

  return NextResponse.json({ articles: result });
}
