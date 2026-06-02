import { NextRequest, NextResponse } from 'next/server';
import { getArticleById, rateArticle, getUserRating } from '@/lib/recommendations';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const article = getArticleById(parseInt(id));
  if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const userRating = getUserRating(parseInt(id));
  return NextResponse.json({ article: { ...article, user_rating: userRating } });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const rating = parseInt(body.rating);
  if (isNaN(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 });
  }
  rateArticle(parseInt(id), rating);
  return NextResponse.json({ success: true, article: getArticleById(parseInt(id)) });
}
