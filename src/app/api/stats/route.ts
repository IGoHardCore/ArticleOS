import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { getTagWeights } from '@/lib/recommendations';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [
    { count: totalArticles },
    { data: userRatingsData },
  ] = await Promise.all([
    db.from('articles').select('*', { count: 'exact', head: true }),
    db.from('ratings').select('article_id, rating').eq('clerk_user_id', userId),
  ]);

  const ratings = (userRatingsData ?? []) as { article_id: number; rating: number }[];
  const ratedArticles = new Set(ratings.map(r => r.article_id)).size;
  const avgRating = ratings.length ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length : 0;

  // Top tags by average rating
  const weights = await getTagWeights(userId);
  const topTags = weights.slice(0, 10).map(w => ({
    name: w.tag_name,
    color: '#6366f1',
    count: 1,
    avg_rating: w.weight,
  }));

  return NextResponse.json({
    totalArticles: totalArticles ?? 0,
    ratedArticles,
    avgRating,
    topTags,
  });
}
