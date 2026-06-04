import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [{ c: totalArticles }] = await sql<{ c: number }[]>`SELECT COUNT(*) as c FROM articles`;
  const [{ c: ratedArticles }] = await sql<{ c: number }[]>`
    SELECT COUNT(DISTINCT article_id) as c FROM ratings WHERE clerk_user_id = ${userId}
  `;
  const [{ avg }] = await sql<{ avg: number | null }[]>`
    SELECT AVG(rating) as avg FROM ratings WHERE clerk_user_id = ${userId}
  `;
  const avgRating = Number(avg) || 0;

  const topTags = await sql<{ name: string; color: string; count: number; avg_rating: number }[]>`
    SELECT t.name, t.color,
      COUNT(DISTINCT r.article_id) as count,
      AVG(r.rating) as avg_rating
    FROM tags t
    JOIN article_tags at ON at.tag_id = t.id
    JOIN ratings r ON r.article_id = at.article_id
    WHERE r.clerk_user_id = ${userId}
    GROUP BY t.id, t.name, t.color
    ORDER BY avg_rating DESC, count DESC
    LIMIT 10
  `;

  return NextResponse.json({
    totalArticles: Number(totalArticles),
    ratedArticles: Number(ratedArticles),
    avgRating,
    topTags: topTags.map(t => ({ ...t, count: Number(t.count), avg_rating: Number(t.avg_rating) })),
  });
}
