import { sql, Article, Tag } from './db';

interface TagScore {
  tag_id: number;
  tag_name: string;
  weight: number;
}

export async function getTagWeights(userId?: string): Promise<TagScore[]> {
  if (userId) {
    return sql<TagScore[]>`
      SELECT at.tag_id, t.name AS tag_name,
        SUM(r.rating * (1.0 / (1 + EXTRACT(EPOCH FROM (NOW() - r.created_at)) / 604800.0))) AS weight
      FROM ratings r
      JOIN article_tags at ON at.article_id = r.article_id
      JOIN tags t ON t.id = at.tag_id
      WHERE r.clerk_user_id = ${userId}
      GROUP BY at.tag_id, t.name ORDER BY weight DESC
    `;
  }
  return sql<TagScore[]>`
    SELECT at.tag_id, t.name AS tag_name,
      SUM(r.rating * (1.0 / (1 + EXTRACT(EPOCH FROM (NOW() - r.created_at)) / 604800.0))) AS weight
    FROM ratings r
    JOIN article_tags at ON at.article_id = r.article_id
    JOIN tags t ON t.id = at.tag_id
    GROUP BY at.tag_id, t.name ORDER BY weight DESC
  `;
}

export async function getRecommendedArticles(limit = 20, offset = 0, userId?: string): Promise<Article[]> {
  const weights = await getTagWeights(userId);

  if (weights.length === 0) {
    return getLatestArticles(limit, offset, userId);
  }

  const weightMap = Object.fromEntries(weights.map(w => [w.tag_id, w.weight]));
  const maxWeight = Math.max(...weights.map(w => w.weight), 1);

  type ArticleRow = Article & { avg_rating: number; rating_count: number };

  const articles: ArticleRow[] = userId
    ? await sql<ArticleRow[]>`
        SELECT DISTINCT
          a.id, a.title, a.url, a.summary, a.source, a.author,
          a.image_url, a.published_at, a.scraped_at,
          AVG(r.rating) AS avg_rating,
          COUNT(DISTINCT r.id) AS rating_count,
          MAX(CASE WHEN r.clerk_user_id = ${userId} THEN r.rating END) AS user_rating
        FROM articles a
        LEFT JOIN ratings r ON r.article_id = a.id AND (r.clerk_user_id = ${userId} OR r.clerk_user_id IS NULL)
        LEFT JOIN article_tags at ON at.article_id = a.id
        GROUP BY a.id ORDER BY a.published_at DESC NULLS LAST LIMIT 200
      `
    : await sql<ArticleRow[]>`
        SELECT DISTINCT
          a.id, a.title, a.url, a.summary, a.source, a.author,
          a.image_url, a.published_at, a.scraped_at,
          AVG(r.rating) AS avg_rating,
          COUNT(DISTINCT r.id) AS rating_count,
          MAX(r.rating) AS user_rating
        FROM articles a
        LEFT JOIN ratings r ON r.article_id = a.id
        LEFT JOIN article_tags at ON at.article_id = a.id
        GROUP BY a.id ORDER BY a.published_at DESC NULLS LAST LIMIT 200
      `;

  const articleIds = articles.map(a => a.id);
  const allTagRows = articleIds.length > 0
    ? await sql<{ article_id: number; id: number; name: string; color: string }[]>`
        SELECT at.article_id, t.id, t.name, t.color
        FROM article_tags at JOIN tags t ON t.id = at.tag_id
        WHERE at.article_id = ANY(${sql.array(articleIds)})
      `
    : [];

  const tagsByArticle = new Map<number, { id: number; name: string; color: string }[]>();
  for (const row of allTagRows) {
    const aid = Number(row.article_id);
    if (!tagsByArticle.has(aid)) tagsByArticle.set(aid, []);
    tagsByArticle.get(aid)!.push({ id: Number(row.id), name: row.name, color: row.color });
  }

  const scored = articles.map(article => {
    const id = Number(article.id);
    const articleTagIds = (tagsByArticle.get(id) || []).map(t => t.id);
    let tagScore = 0;
    for (const tag_id of articleTagIds) {
      if (weightMap[tag_id]) tagScore += weightMap[tag_id] / maxWeight;
    }
    const hoursOld = article.published_at
      ? (Date.now() - new Date(article.published_at).getTime()) / 3600000
      : 168;
    const recencyBonus = Math.max(0, 1 - hoursOld / 72);
    const noveltyBonus = article.rating_count > 0 ? 0 : 0.2;
    article.score = tagScore * 2 + recencyBonus + noveltyBonus;
    return article;
  });

  scored.sort((a, b) => (b.score || 0) - (a.score || 0));
  return scored.slice(offset, offset + limit).map(article => ({
    ...article,
    id: Number(article.id),
    tags: tagsByArticle.get(Number(article.id)) || [],
  }));
}

export async function getTopPick(period: 'week' | 'month', userId?: string): Promise<Article | null> {
  const cutoff = new Date(Date.now() - (period === 'week' ? 7 : 30) * 24 * 60 * 60 * 1000);

  type TopRow = Article & { avg_rating: number; rating_count: number; score: number };

  const rows: TopRow[] = userId
    ? await sql<TopRow[]>`
        SELECT a.id, a.title, a.url, a.summary, a.source, a.author,
          a.image_url, a.published_at, a.scraped_at,
          AVG(r.rating) AS avg_rating, COUNT(r.id) AS rating_count,
          AVG(r.rating) * COUNT(r.id) AS score
        FROM articles a
        JOIN ratings r ON r.article_id = a.id
        WHERE r.created_at >= ${cutoff} AND r.clerk_user_id = ${userId}
        GROUP BY a.id HAVING COUNT(r.id) >= 1
        ORDER BY score DESC LIMIT 1
      `
    : await sql<TopRow[]>`
        SELECT a.id, a.title, a.url, a.summary, a.source, a.author,
          a.image_url, a.published_at, a.scraped_at,
          AVG(r.rating) AS avg_rating, COUNT(r.id) AS rating_count,
          AVG(r.rating) * COUNT(r.id) AS score
        FROM articles a
        JOIN ratings r ON r.article_id = a.id
        WHERE r.created_at >= ${cutoff}
        GROUP BY a.id HAVING COUNT(r.id) >= 1
        ORDER BY score DESC LIMIT 1
      `;

  if (!rows.length) return null;
  const row = { ...rows[0], id: Number(rows[0].id) };
  return { ...row, tags: await getArticleTags(row.id) };
}

export async function getLatestArticles(limit = 20, offset = 0, userId?: string): Promise<Article[]> {
  const articles: Article[] = userId
    ? await sql<Article[]>`
        SELECT a.id, a.title, a.url, a.summary, a.source, a.author,
          a.image_url, a.published_at, a.scraped_at,
          AVG(r.rating) AS avg_rating, COUNT(DISTINCT r.id) AS rating_count,
          MAX(CASE WHEN r.clerk_user_id = ${userId} THEN r.rating END) AS user_rating
        FROM articles a
        LEFT JOIN ratings r ON r.article_id = a.id
        GROUP BY a.id ORDER BY a.published_at DESC NULLS LAST LIMIT ${limit} OFFSET ${offset}
      `
    : await sql<Article[]>`
        SELECT a.id, a.title, a.url, a.summary, a.source, a.author,
          a.image_url, a.published_at, a.scraped_at,
          AVG(r.rating) AS avg_rating, COUNT(DISTINCT r.id) AS rating_count,
          MAX(r.rating) AS user_rating
        FROM articles a
        LEFT JOIN ratings r ON r.article_id = a.id
        GROUP BY a.id ORDER BY a.published_at DESC NULLS LAST LIMIT ${limit} OFFSET ${offset}
      `;

  if (articles.length === 0) return [];
  const ids = articles.map(a => Number(a.id));
  const tagRows = await sql<{ article_id: number; id: number; name: string; color: string }[]>`
    SELECT at.article_id, t.id, t.name, t.color
    FROM article_tags at JOIN tags t ON t.id = at.tag_id
    WHERE at.article_id = ANY(${sql.array(ids)})
  `;
  const tagMap = new Map<number, { id: number; name: string; color: string }[]>();
  for (const r of tagRows) {
    const aid = Number(r.article_id);
    if (!tagMap.has(aid)) tagMap.set(aid, []);
    tagMap.get(aid)!.push({ id: Number(r.id), name: r.name, color: r.color });
  }
  return articles.map(a => ({ ...a, id: Number(a.id), tags: tagMap.get(Number(a.id)) || [] }));
}

export async function getArticleById(id: number): Promise<Article | null> {
  const rows = await sql<Article[]>`
    SELECT a.*, AVG(r.rating) AS avg_rating, COUNT(DISTINCT r.id) AS rating_count
    FROM articles a LEFT JOIN ratings r ON r.article_id = a.id
    WHERE a.id = ${id} GROUP BY a.id
  `;
  if (!rows.length) return null;
  const article = { ...rows[0], id: Number(rows[0].id) };
  return { ...article, tags: await getArticleTags(id) };
}

export async function getArticleTags(articleId: number): Promise<Tag[]> {
  const rows = await sql<Tag[]>`
    SELECT t.id, t.name, t.color FROM tags t
    JOIN article_tags at ON at.tag_id = t.id WHERE at.article_id = ${articleId}
  `;
  return rows.map(r => ({ ...r, id: Number(r.id) }));
}

export async function rateArticle(articleId: number, rating: number, userId?: string): Promise<void> {
  if (userId) {
    const existing = await sql`SELECT id FROM ratings WHERE article_id = ${articleId} AND clerk_user_id = ${userId}`;
    if (existing.length) {
      await sql`UPDATE ratings SET rating = ${rating}, created_at = NOW() WHERE article_id = ${articleId} AND clerk_user_id = ${userId}`;
    } else {
      await sql`INSERT INTO ratings (article_id, rating, clerk_user_id) VALUES (${articleId}, ${rating}, ${userId})`;
    }
  } else {
    const existing = await sql`SELECT id FROM ratings WHERE article_id = ${articleId} AND clerk_user_id IS NULL`;
    if (existing.length) {
      await sql`UPDATE ratings SET rating = ${rating}, created_at = NOW() WHERE article_id = ${articleId} AND clerk_user_id IS NULL`;
    } else {
      await sql`INSERT INTO ratings (article_id, rating, clerk_user_id) VALUES (${articleId}, ${rating}, NULL)`;
    }
  }
}

export async function getUserRating(articleId: number, userId?: string): Promise<number | null> {
  const rows = userId
    ? await sql<{ rating: number }[]>`SELECT rating FROM ratings WHERE article_id = ${articleId} AND clerk_user_id = ${userId}`
    : await sql<{ rating: number }[]>`SELECT rating FROM ratings WHERE article_id = ${articleId} AND clerk_user_id IS NULL`;
  return rows[0]?.rating ?? null;
}

export async function isBookmarked(articleId: number, userId: string): Promise<boolean> {
  const rows = await sql`SELECT 1 FROM bookmarks WHERE clerk_user_id = ${userId} AND article_id = ${articleId}`;
  return rows.length > 0;
}

export async function setBookmark(articleId: number, userId: string, value: boolean): Promise<void> {
  if (value) {
    await sql`INSERT INTO bookmarks (clerk_user_id, article_id) VALUES (${userId}, ${articleId}) ON CONFLICT DO NOTHING`;
  } else {
    await sql`DELETE FROM bookmarks WHERE clerk_user_id = ${userId} AND article_id = ${articleId}`;
  }
}

export async function searchArticles(query: string, tagFilter?: string): Promise<Article[]> {
  const like = `%${query}%`;
  const articles: Article[] = tagFilter
    ? await sql<Article[]>`
        SELECT DISTINCT a.id, a.title, a.url, a.summary, a.source, a.author,
          a.image_url, a.published_at, a.scraped_at,
          AVG(r.rating) AS avg_rating, COUNT(DISTINCT r.id) AS rating_count
        FROM articles a
        LEFT JOIN ratings r ON r.article_id = a.id
        LEFT JOIN article_tags at2 ON at2.article_id = a.id
        LEFT JOIN tags t2 ON t2.id = at2.tag_id
        WHERE (a.title ILIKE ${like} OR a.summary ILIKE ${like} OR a.source ILIKE ${like})
          AND t2.name = ${tagFilter}
        GROUP BY a.id ORDER BY a.published_at DESC NULLS LAST LIMIT 50
      `
    : await sql<Article[]>`
        SELECT DISTINCT a.id, a.title, a.url, a.summary, a.source, a.author,
          a.image_url, a.published_at, a.scraped_at,
          AVG(r.rating) AS avg_rating, COUNT(DISTINCT r.id) AS rating_count
        FROM articles a
        LEFT JOIN ratings r ON r.article_id = a.id
        WHERE (a.title ILIKE ${like} OR a.summary ILIKE ${like} OR a.source ILIKE ${like})
        GROUP BY a.id ORDER BY a.published_at DESC NULLS LAST LIMIT 50
      `;

  if (articles.length === 0) return [];
  const ids = articles.map(a => Number(a.id));
  const tagRows = await sql<{ article_id: number; id: number; name: string; color: string }[]>`
    SELECT at.article_id, t.id, t.name, t.color
    FROM article_tags at JOIN tags t ON t.id = at.tag_id
    WHERE at.article_id = ANY(${sql.array(ids)})
  `;
  const tagMap = new Map<number, { id: number; name: string; color: string }[]>();
  for (const r of tagRows) {
    const aid = Number(r.article_id);
    if (!tagMap.has(aid)) tagMap.set(aid, []);
    tagMap.get(aid)!.push({ id: Number(r.id), name: r.name, color: r.color });
  }
  return articles.map(a => ({ ...a, id: Number(a.id), tags: tagMap.get(Number(a.id)) || [] }));
}
