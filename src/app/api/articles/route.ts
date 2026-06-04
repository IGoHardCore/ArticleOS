import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getRecommendedArticles, getLatestArticles, searchArticles, getTopPick } from '@/lib/recommendations';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('mode') || 'recommended';
  const query = searchParams.get('q') || '';
  const tag = searchParams.get('tag') || '';
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    if (query) {
      const articles = await searchArticles(query, tag || undefined);
      return NextResponse.json({ articles, total: articles.length });
    }

    if (mode === 'latest') {
      return NextResponse.json({ articles: await getLatestArticles(limit, offset, userId ?? undefined) });
    }

    if (mode === 'top-pick') {
      const period = (searchParams.get('period') || 'week') as 'week' | 'month';
      return NextResponse.json({ article: await getTopPick(period, userId ?? undefined) });
    }

    if (mode === 'by-tag') {
      const { data: tagRow } = await db.from('tags').select('id').eq('name', tag).maybeSingle();
      if (!tagRow) return NextResponse.json({ articles: [] });
      const { data: tagLinks } = await db.from('article_tags').select('article_id').eq('tag_id', (tagRow as { id: number }).id);
      const taggedIds = (tagLinks ?? []).map((l: { article_id: number }) => l.article_id);
      if (!taggedIds.length) return NextResponse.json({ articles: [] });

      const { data: raw } = await db
        .from('articles')
        .select('*')
        .in('id', taggedIds)
        .order('published_at', { ascending: false, nullsFirst: false })
        .range(offset, offset + limit - 1);

      const articles = raw ?? [];
      const ids = articles.map((a: { id: number }) => a.id);
      const { data: tagLinksFull } = await db.from('article_tags').select('article_id, tags(id, name, color)').in('article_id', ids);
      const tagMap = new Map<number, { id: number; name: string; color: string }[]>();
      for (const row of tagLinksFull ?? []) {
        const r = row as unknown as { article_id: number; tags: { id: number; name: string; color: string } };
        const t = r.tags;
        if (!t) continue;
        const aid = r.article_id;
        const arr = tagMap.get(aid) ?? [];
        arr.push(t);
        tagMap.set(aid, arr);
      }
      return NextResponse.json({ articles: articles.map((a: { id: number }) => ({ ...a, tags: tagMap.get(a.id) ?? [] })) });
    }

    return NextResponse.json({ articles: await getRecommendedArticles(limit, offset, userId ?? undefined) });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}
