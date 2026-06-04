import { db, Article, Tag } from './db';

interface TagScore {
  tag_id: number;
  tag_name: string;
  weight: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function fetchTagsForIds(ids: number[]): Promise<Map<number, Tag[]>> {
  if (!ids.length) return new Map();
  const { data } = await db
    .from('article_tags')
    .select('article_id, tags(id, name, color)')
    .in('article_id', ids);
  const map = new Map<number, Tag[]>();
  for (const row of data || []) {
    const t = row.tags as unknown as Tag;
    if (!t) continue;
    const arr = map.get(row.article_id) ?? [];
    arr.push(t);
    map.set(row.article_id, arr);
  }
  return map;
}

type RatingRow = { article_id: number; rating: number; clerk_user_id: string | null; created_at: string };

async function fetchRatingsForIds(ids: number[]): Promise<RatingRow[]> {
  if (!ids.length) return [];
  const { data } = await db
    .from('ratings')
    .select('article_id, rating, clerk_user_id, created_at')
    .in('article_id', ids);
  return (data ?? []) as RatingRow[];
}

function aggregateRatings(ratings: RatingRow[], userId?: string) {
  const byArticle = new Map<number, RatingRow[]>();
  for (const r of ratings) {
    const arr = byArticle.get(r.article_id) ?? [];
    arr.push(r);
    byArticle.set(r.article_id, arr);
  }
  return {
    avgRating: (id: number) => {
      const rs = byArticle.get(id) ?? [];
      return rs.length ? rs.reduce((s, r) => s + r.rating, 0) / rs.length : 0;
    },
    ratingCount: (id: number) => (byArticle.get(id) ?? []).length,
    userRating: (id: number) => {
      if (!userId) return null;
      return byArticle.get(id)?.find(r => r.clerk_user_id === userId)?.rating ?? null;
    },
  };
}

// ── Public API ─────────────────────────────────────────────────────────────

export async function getTagWeights(userId?: string): Promise<TagScore[]> {
  const { data: ratings } = userId
    ? await db.from('ratings').select('article_id, rating, created_at').eq('clerk_user_id', userId)
    : await db.from('ratings').select('article_id, rating, created_at');
  if (!ratings?.length) return [];

  const articleIds = [...new Set(ratings.map((r: { article_id: number }) => r.article_id))];
  const { data: tagLinks } = await db
    .from('article_tags')
    .select('article_id, tags(id, name, color)')
    .in('article_id', articleIds);

  const weights = new Map<number, TagScore>();
  for (const r of ratings as { article_id: number; rating: number; created_at: string }[]) {
    const recency = 1.0 / (1 + (Date.now() - new Date(r.created_at).getTime()) / 604800000);
    const contribution = r.rating * recency;
    const links = (tagLinks ?? []).filter((l: { article_id: number }) => l.article_id === r.article_id);
    for (const link of links) {
      const t = link.tags as unknown as Tag;
      if (!t) continue;
      const existing = weights.get(t.id) ?? { tag_id: t.id, tag_name: t.name, weight: 0 };
      existing.weight += contribution;
      weights.set(t.id, existing);
    }
  }
  return [...weights.values()].sort((a, b) => b.weight - a.weight);
}

export async function getRecommendedArticles(limit = 20, offset = 0, userId?: string): Promise<Article[]> {
  const weights = await getTagWeights(userId);
  if (!weights.length) return getLatestArticles(limit, offset, userId);

  const weightMap = Object.fromEntries(weights.map(w => [w.tag_id, w.weight]));
  const maxWeight = Math.max(...weights.map(w => w.weight), 1);

  const { data: raw } = await db
    .from('articles')
    .select('*')
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(200);

  const articles = (raw ?? []) as Article[];
  const ids = articles.map(a => a.id);
  const [tagMap, ratings] = await Promise.all([fetchTagsForIds(ids), fetchRatingsForIds(ids)]);
  const agg = aggregateRatings(ratings, userId);

  const scored = articles.map(a => {
    const articleTags = tagMap.get(a.id) ?? [];
    let tagScore = 0;
    for (const t of articleTags) {
      if (weightMap[t.id]) tagScore += weightMap[t.id] / maxWeight;
    }
    const hoursOld = a.published_at
      ? (Date.now() - new Date(a.published_at).getTime()) / 3600000
      : 168;
    const recencyBonus = Math.max(0, 1 - hoursOld / 72);
    const noveltyBonus = agg.ratingCount(a.id) === 0 ? 0.2 : 0;
    return {
      ...a,
      tags: articleTags,
      avg_rating: agg.avgRating(a.id),
      rating_count: agg.ratingCount(a.id),
      user_rating: agg.userRating(a.id) ?? undefined,
      score: tagScore * 2 + recencyBonus + noveltyBonus,
    };
  });

  scored.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  return scored.slice(offset, offset + limit);
}

export async function getTopPick(period: 'week' | 'month', userId?: string): Promise<Article | null> {
  const cutoff = new Date(Date.now() - (period === 'week' ? 7 : 30) * 86400000).toISOString();

  const { data: periodRatings } = userId
    ? await db.from('ratings').select('article_id, rating').gte('created_at', cutoff).eq('clerk_user_id', userId)
    : await db.from('ratings').select('article_id, rating').gte('created_at', cutoff);
  if (!periodRatings?.length) return null;

  const scoreMap = new Map<number, { sum: number; count: number }>();
  for (const r of periodRatings as { article_id: number; rating: number }[]) {
    const s = scoreMap.get(r.article_id) ?? { sum: 0, count: 0 };
    s.sum += r.rating; s.count++;
    scoreMap.set(r.article_id, s);
  }

  const [bestId] = [...scoreMap.entries()]
    .sort(([, a], [, b]) => (b.sum / b.count) * b.count - (a.sum / a.count) * a.count);
  if (!bestId) return null;

  return getArticleById(bestId[0]);
}

export async function getLatestArticles(limit = 20, offset = 0, userId?: string): Promise<Article[]> {
  const { data: raw } = await db
    .from('articles')
    .select('*')
    .order('published_at', { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);

  const articles = (raw ?? []) as Article[];
  const ids = articles.map(a => a.id);
  const [tagMap, ratings] = await Promise.all([fetchTagsForIds(ids), fetchRatingsForIds(ids)]);
  const agg = aggregateRatings(ratings, userId);

  return articles.map(a => ({
    ...a,
    tags: tagMap.get(a.id) ?? [],
    avg_rating: agg.avgRating(a.id),
    rating_count: agg.ratingCount(a.id),
    user_rating: agg.userRating(a.id) ?? undefined,
  }));
}

export async function getArticleById(id: number): Promise<Article | null> {
  const { data } = await db.from('articles').select('*').eq('id', id).single();
  if (!data) return null;
  const [tags, ratings] = await Promise.all([
    fetchTagsForIds([id]),
    fetchRatingsForIds([id]),
  ]);
  const agg = aggregateRatings(ratings);
  return {
    ...(data as Article),
    tags: tags.get(id) ?? [],
    avg_rating: agg.avgRating(id),
    rating_count: agg.ratingCount(id),
  };
}

export async function getArticleTags(articleId: number): Promise<Tag[]> {
  return (await fetchTagsForIds([articleId])).get(articleId) ?? [];
}

export async function rateArticle(articleId: number, rating: number, userId?: string): Promise<void> {
  const match = userId
    ? { article_id: articleId, clerk_user_id: userId }
    : { article_id: articleId, clerk_user_id: null as null };

  const { data: existing } = await db.from('ratings').select('id').match(match).maybeSingle();
  if (existing) {
    await db.from('ratings').update({ rating, created_at: new Date().toISOString() }).eq('id', existing.id);
  } else {
    await db.from('ratings').insert({ article_id: articleId, rating, clerk_user_id: userId ?? null });
  }
}

export async function getUserRating(articleId: number, userId?: string): Promise<number | null> {
  const match = userId
    ? { article_id: articleId, clerk_user_id: userId }
    : { article_id: articleId, clerk_user_id: null as null };
  const { data } = await db.from('ratings').select('rating').match(match).maybeSingle();
  return (data as { rating: number } | null)?.rating ?? null;
}

export async function isBookmarked(articleId: number, userId: string): Promise<boolean> {
  const { data } = await db.from('bookmarks').select('article_id').match({ clerk_user_id: userId, article_id: articleId }).maybeSingle();
  return !!data;
}

export async function setBookmark(articleId: number, userId: string, value: boolean): Promise<void> {
  if (value) {
    await db.from('bookmarks').upsert({ clerk_user_id: userId, article_id: articleId }, { onConflict: 'clerk_user_id,article_id', ignoreDuplicates: true });
  } else {
    await db.from('bookmarks').delete().match({ clerk_user_id: userId, article_id: articleId });
  }
}

export async function searchArticles(query: string, tagFilter?: string): Promise<Article[]> {
  let q = db.from('articles').select('*').ilike('title', `%${query}%`).limit(50);
  const { data: raw } = await q;

  let articles = (raw ?? []) as Article[];

  // Summary fallback search
  if (articles.length < 50) {
    const { data: bySummary } = await db.from('articles').select('*').ilike('summary', `%${query}%`).limit(50 - articles.length);
    const existingIds = new Set(articles.map(a => a.id));
    for (const a of (bySummary ?? []) as Article[]) {
      if (!existingIds.has(a.id)) articles.push(a);
    }
  }

  if (tagFilter) {
    const { data: tagRows } = await db.from('tags').select('id').eq('name', tagFilter).maybeSingle();
    if (tagRows) {
      const { data: links } = await db.from('article_tags').select('article_id').eq('tag_id', (tagRows as { id: number }).id);
      const taggedIds = new Set((links ?? []).map((l: { article_id: number }) => l.article_id));
      articles = articles.filter(a => taggedIds.has(a.id));
    }
  }

  const ids = articles.map(a => a.id);
  const tagMap = await fetchTagsForIds(ids);
  return articles.map(a => ({ ...a, tags: tagMap.get(a.id) ?? [] }));
}
