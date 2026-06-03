import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { Article, Tag } from '@/lib/db';

export async function GET() {
  const db = getDb();

  const articles = db.prepare(`
    SELECT a.*, r.rating as user_rating
    FROM articles a
    LEFT JOIN (
      SELECT article_id, MAX(rating) as rating FROM ratings GROUP BY article_id
    ) r ON r.article_id = a.id
    WHERE a.bookmarked = 1
    ORDER BY a.published_at DESC
  `).all() as (Article & { user_rating?: number })[];

  const getTags = db.prepare(`
    SELECT t.id, t.name, t.color
    FROM tags t
    JOIN article_tags at ON at.tag_id = t.id
    WHERE at.article_id = ?
  `);

  const result = articles.map(a => ({
    ...a,
    tags: getTags.all(a.id) as Tag[],
  }));

  return NextResponse.json({ articles: result });
}
