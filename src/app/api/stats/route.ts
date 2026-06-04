import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const totalArticles = (db.prepare('SELECT COUNT(*) as c FROM articles').get() as { c: number }).c;
  const ratedArticles = (db.prepare(
    'SELECT COUNT(DISTINCT article_id) as c FROM ratings WHERE clerk_user_id = ?'
  ).get(userId) as { c: number }).c;
  const avgRatingRow = db.prepare(
    'SELECT AVG(rating) as avg FROM ratings WHERE clerk_user_id = ?'
  ).get(userId) as { avg: number | null };
  const avgRating = avgRatingRow.avg || 0;

  // Only show tags where THIS user has rated articles
  const topTags = db.prepare(`
    SELECT t.name, t.color,
      COUNT(DISTINCT r.article_id) as count,
      AVG(r.rating) as avg_rating
    FROM tags t
    JOIN article_tags at ON at.tag_id = t.id
    JOIN ratings r ON r.article_id = at.article_id
    WHERE r.clerk_user_id = ?
    GROUP BY t.id
    ORDER BY avg_rating DESC, count DESC
    LIMIT 10
  `).all(userId) as { name: string; color: string; count: number; avg_rating: number }[];

  return NextResponse.json({ totalArticles, ratedArticles, avgRating, topTags });
}
