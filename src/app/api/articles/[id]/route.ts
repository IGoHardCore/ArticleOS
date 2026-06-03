import { NextRequest, NextResponse } from 'next/server';
import { getArticleById, rateArticle, getUserRating } from '@/lib/recommendations';
import { getDb } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = parseInt(id);
  if (isNaN(numId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const article = getArticleById(numId);
  if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const userRating = getUserRating(numId);
  return NextResponse.json({ article: { ...article, user_rating: userRating } });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = parseInt(id);
  if (isNaN(numId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const body = await req.json();
  const db = getDb();

  if (typeof body.bookmarked === 'boolean') {
    db.prepare('UPDATE articles SET bookmarked = ? WHERE id = ?').run(body.bookmarked ? 1 : 0, numId);
    return NextResponse.json({ success: true });
  }

  const rating = parseInt(body.rating);
  if (isNaN(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 });
  }

  rateArticle(numId, rating);
  // Auto-bookmark Must Read (5-star) articles
  if (rating === 5) {
    db.prepare('UPDATE articles SET bookmarked = 1 WHERE id = ?').run(numId);
  }

  return NextResponse.json({ success: true, article: getArticleById(numId) });
}
