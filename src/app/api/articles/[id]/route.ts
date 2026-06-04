import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getArticleById, rateArticle, getUserRating, isBookmarked, setBookmark } from '@/lib/recommendations';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  const { id } = await params;
  const numId = parseInt(id);
  if (isNaN(numId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const article = getArticleById(numId);
  if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const userRating = getUserRating(numId, userId ?? undefined);
  const bookmarked = userId ? isBookmarked(numId, userId) : false;
  return NextResponse.json({ article: { ...article, user_rating: userRating, bookmarked: bookmarked ? 1 : 0 } });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const numId = parseInt(id);
  if (isNaN(numId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const body = await req.json();

  if (typeof body.bookmarked === 'boolean') {
    setBookmark(numId, userId, body.bookmarked);
    return NextResponse.json({ success: true });
  }

  const rating = parseInt(body.rating);
  if (isNaN(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 });
  }

  rateArticle(numId, rating, userId);
  if (rating === 5) setBookmark(numId, userId, true);

  return NextResponse.json({ success: true, article: getArticleById(numId) });
}
