import { NextRequest, NextResponse } from 'next/server';
import { getArticleById, rateArticle, getUserRating } from '@/lib/recommendations';

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
  const rating = parseInt(body.rating);

  if (isNaN(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 });
  }

  rateArticle(numId, rating);
  return NextResponse.json({ success: true, article: getArticleById(numId) });
}
