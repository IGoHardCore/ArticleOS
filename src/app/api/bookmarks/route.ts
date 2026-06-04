import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, Article, Tag } from '@/lib/db';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: bookmarkData } = await db
    .from('bookmarks')
    .select('article_id, created_at')
    .eq('clerk_user_id', userId)
    .order('created_at', { ascending: false });

  const ids = (bookmarkData ?? []).map((b: { article_id: number }) => b.article_id);
  if (!ids.length) return NextResponse.json({ articles: [] });

  const [{ data: articlesData }, { data: tagLinks }, { data: ratingsData }] = await Promise.all([
    db.from('articles').select('*').in('id', ids),
    db.from('article_tags').select('article_id, tags(id, name, color)').in('article_id', ids),
    db.from('ratings').select('article_id, rating').eq('clerk_user_id', userId).in('article_id', ids),
  ]);

  const tagMap = new Map<number, Tag[]>();
  for (const row of tagLinks ?? []) {
    const t = (row as { article_id: number; tags: unknown }).tags as Tag;
    if (!t) continue;
    const arr = tagMap.get((row as { article_id: number }).article_id) ?? [];
    arr.push(t);
    tagMap.set((row as { article_id: number }).article_id, arr);
  }

  const ratingMap = new Map<number, number>();
  for (const r of (ratingsData ?? []) as { article_id: number; rating: number }[]) {
    ratingMap.set(r.article_id, r.rating);
  }

  // Preserve bookmark order
  const articleMap = new Map<number, Article>((articlesData ?? []).map((a: Article) => [a.id, a]));
  const result = ids
    .map(id => {
      const a = articleMap.get(id);
      if (!a) return null;
      return { ...a, bookmarked: 1, tags: tagMap.get(id) ?? [], user_rating: ratingMap.get(id) };
    })
    .filter(Boolean);

  return NextResponse.json({ articles: result });
}
