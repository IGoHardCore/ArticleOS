import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const totalArticles = (db.prepare('SELECT COUNT(*) as c FROM articles').get() as { c: number }).c;
  const ratedArticles = (db.prepare('SELECT COUNT(DISTINCT article_id) as c FROM ratings').get() as { c: number }).c;
  const avgRatingRow = db.prepare('SELECT AVG(rating) as avg FROM ratings').get() as { avg: number | null };
  const avgRating = avgRatingRow.avg || 0;
  const topTags = db.prepare(`
    SELECT t.name, t.color, COUNT(DISTINCT at.article_id) as count, AVG(r.rating) as avg_rating
    FROM tags t
    JOIN article_tags at ON at.tag_id = t.id
    LEFT JOIN ratings r ON r.article_id = at.article_id
    GROUP BY t.id
    HAVING count > 0
    ORDER BY count DESC
    LIMIT 15
  `).all() as { name: string; color: string; count: number; avg_rating: number }[];
  return NextResponse.json({ totalArticles, ratedArticles, avgRating, topTags });
}
