import { getDb, Article, Tag } from './db';

interface TagScore {
  tag_id: number;
  tag_name: string;
  weight: number;
}

export function getTagWeights(userId?: string): TagScore[] {
  const db = getDb();
  const query = userId
    ? `SELECT at.tag_id, t.name AS tag_name,
         SUM(r.rating * (1.0 / (1 + (julianday('now') - julianday(r.created_at)) / 7.0))) AS weight
       FROM ratings r
       JOIN article_tags at ON at.article_id = r.article_id
       JOIN tags t ON t.id = at.tag_id
       WHERE r.clerk_user_id = ?
       GROUP BY at.tag_id ORDER BY weight DESC`
    : `SELECT at.tag_id, t.name AS tag_name,
         SUM(r.rating * (1.0 / (1 + (julianday('now') - julianday(r.created_at)) / 7.0))) AS weight
       FROM ratings r
       JOIN article_tags at ON at.article_id = r.article_id
       JOIN tags t ON t.id = at.tag_id
       GROUP BY at.tag_id ORDER BY weight DESC`;
  return (userId ? db.prepare(query).all(userId) : db.prepare(query).all()) as TagScore[];
}

export function getRecommendedArticles(limit = 20, offset = 0, userId?: string): Article[] {
  const db = getDb();
  const weights = getTagWeights(userId);

  if (weights.length === 0) {
    return getLatestArticles(limit, offset, userId);
  }

  const weightMap = Object.fromEntries(weights.map(w => [w.tag_id, w.weight]));
  const maxWeight = Math.max(...weights.map(w => w.weight), 1);

  const userFilter = userId ? `WHERE r.clerk_user_id = ? OR r.clerk_user_id IS NULL` : '';
  const articles = db.prepare(`
    SELECT DISTINCT
      a.id, a.title, a.url, a.summary, a.source, a.author,
      a.image_url, a.published_at, a.scraped_at,
      AVG(r.rating) AS avg_rating,
      COUNT(DISTINCT r.id) AS rating_count,
      MAX(CASE WHEN r.clerk_user_id = ${userId ? '?' : 'NULL'} THEN r.rating END) AS user_rating
    FROM articles a
    LEFT JOIN ratings r ON r.article_id = a.id ${userFilter}
    LEFT JOIN article_tags at ON at.article_id = a.id
    GROUP BY a.id
    ORDER BY a.published_at DESC
    LIMIT 200
  `).all(...(userId ? [userId, userId] : [])) as (Article & { avg_rating: number; rating_count: number })[];

  const articleIds = articles.map(a => a.id);
  const placeholders = articleIds.map(() => '?').join(',');
  const allTagRows = articleIds.length > 0
    ? (db.prepare(`
        SELECT at.article_id, t.id, t.name, t.color
        FROM article_tags at JOIN tags t ON t.id = at.tag_id
        WHERE at.article_id IN (${placeholders})
      `).all(...articleIds) as { article_id: number; id: number; name: string; color: string }[])
    : [];

  const tagsByArticle = new Map<number, { id: number; name: string; color: string }[]>();
  for (const row of allTagRows) {
    if (!tagsByArticle.has(row.article_id)) tagsByArticle.set(row.article_id, []);
    tagsByArticle.get(row.article_id)!.push({ id: row.id, name: row.name, color: row.color });
  }

  const scored = articles.map(article => {
    const articleTagIds = (tagsByArticle.get(article.id) || []).map(t => t.id);
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
    tags: tagsByArticle.get(article.id) || [],
  }));
}

export function getTopPick(period: 'week' | 'month', userId?: string): Article | null {
  const db = getDb();
  const days = period === 'week' ? 7 : 30;
  const userClause = userId ? `AND r.clerk_user_id = ?` : '';
  const row = db.prepare(`
    SELECT a.id, a.title, a.url, a.summary, a.source, a.author,
      a.image_url, a.published_at, a.scraped_at,
      AVG(r.rating) AS avg_rating, COUNT(r.id) AS rating_count,
      AVG(r.rating) * COUNT(r.id) AS score
    FROM articles a
    JOIN ratings r ON r.article_id = a.id
    WHERE r.created_at >= datetime('now', ? || ' days') ${userClause}
    GROUP BY a.id HAVING rating_count >= 1
    ORDER BY score DESC LIMIT 1
  `).get(...([`-${days}`].concat(userId ? [userId] : []))) as (Article & { avg_rating: number; rating_count: number }) | undefined;

  if (!row) return null;
  return { ...row, tags: getArticleTags(row.id) };
}

export function getLatestArticles(limit = 20, offset = 0, userId?: string): Article[] {
  const db = getDb();
  const userRatingSelect = userId
    ? `MAX(CASE WHEN r.clerk_user_id = ? THEN r.rating END) AS user_rating`
    : `MAX(r.rating) AS user_rating`;
  const articles = db.prepare(`
    SELECT a.id, a.title, a.url, a.summary, a.source, a.author,
      a.image_url, a.published_at, a.scraped_at,
      AVG(r.rating) AS avg_rating, COUNT(DISTINCT r.id) AS rating_count,
      ${userRatingSelect}
    FROM articles a
    LEFT JOIN ratings r ON r.article_id = a.id
    GROUP BY a.id ORDER BY a.published_at DESC LIMIT ? OFFSET ?
  `).all(...(userId ? [userId, limit, offset] : [limit, offset])) as Article[];

  if (articles.length === 0) return [];
  const ids = articles.map(a => a.id);
  const tagRows = db.prepare(`
    SELECT at.article_id, t.id, t.name, t.color
    FROM article_tags at JOIN tags t ON t.id = at.tag_id
    WHERE at.article_id IN (${ids.map(() => '?').join(',')})
  `).all(...ids) as { article_id: number; id: number; name: string; color: string }[];
  const tagMap = new Map<number, { id: number; name: string; color: string }[]>();
  for (const r of tagRows) {
    if (!tagMap.has(r.article_id)) tagMap.set(r.article_id, []);
    tagMap.get(r.article_id)!.push({ id: r.id, name: r.name, color: r.color });
  }
  return articles.map(a => ({ ...a, tags: tagMap.get(a.id) || [] }));
}

export function getArticleById(id: number): Article | null {
  const db = getDb();
  const article = db.prepare(`
    SELECT a.*, AVG(r.rating) AS avg_rating, COUNT(DISTINCT r.id) AS rating_count
    FROM articles a LEFT JOIN ratings r ON r.article_id = a.id
    WHERE a.id = ? GROUP BY a.id
  `).get(id) as Article | undefined;
  if (!article) return null;
  return { ...article, tags: getArticleTags(id) };
}

export function getArticleTags(articleId: number): Tag[] {
  const db = getDb();
  return db.prepare(`
    SELECT t.id, t.name, t.color FROM tags t
    JOIN article_tags at ON at.tag_id = t.id WHERE at.article_id = ?
  `).all(articleId) as Tag[];
}

export function rateArticle(articleId: number, rating: number, userId?: string): void {
  const db = getDb();
  const existing = db.prepare(
    userId
      ? 'SELECT id FROM ratings WHERE article_id = ? AND clerk_user_id = ?'
      : 'SELECT id FROM ratings WHERE article_id = ? AND clerk_user_id IS NULL'
  ).get(...(userId ? [articleId, userId] : [articleId]));

  if (existing) {
    db.prepare(
      userId
        ? "UPDATE ratings SET rating = ?, created_at = datetime('now') WHERE article_id = ? AND clerk_user_id = ?"
        : "UPDATE ratings SET rating = ?, created_at = datetime('now') WHERE article_id = ? AND clerk_user_id IS NULL"
    ).run(...(userId ? [rating, articleId, userId] : [rating, articleId]));
  } else {
    db.prepare('INSERT INTO ratings (article_id, rating, clerk_user_id) VALUES (?, ?, ?)')
      .run(articleId, rating, userId ?? null);
  }
}

export function getUserRating(articleId: number, userId?: string): number | null {
  const db = getDb();
  const row = db.prepare(
    userId
      ? 'SELECT rating FROM ratings WHERE article_id = ? AND clerk_user_id = ?'
      : 'SELECT rating FROM ratings WHERE article_id = ? AND clerk_user_id IS NULL'
  ).get(...(userId ? [articleId, userId] : [articleId])) as { rating: number } | undefined;
  return row?.rating ?? null;
}

export function isBookmarked(articleId: number, userId: string): boolean {
  const db = getDb();
  return !!db.prepare('SELECT 1 FROM bookmarks WHERE clerk_user_id = ? AND article_id = ?').get(userId, articleId);
}

export function setBookmark(articleId: number, userId: string, value: boolean): void {
  const db = getDb();
  if (value) {
    db.prepare('INSERT OR IGNORE INTO bookmarks (clerk_user_id, article_id) VALUES (?, ?)').run(userId, articleId);
  } else {
    db.prepare('DELETE FROM bookmarks WHERE clerk_user_id = ? AND article_id = ?').run(userId, articleId);
  }
}

export function searchArticles(query: string, tagFilter?: string): Article[] {
  const db = getDb();
  let sql = `
    SELECT DISTINCT a.id, a.title, a.url, a.summary, a.source, a.author,
      a.image_url, a.published_at, a.scraped_at,
      AVG(r.rating) AS avg_rating, COUNT(DISTINCT r.id) AS rating_count
    FROM articles a
    LEFT JOIN ratings r ON r.article_id = a.id
    LEFT JOIN article_tags at2 ON at2.article_id = a.id
    LEFT JOIN tags t2 ON t2.id = at2.tag_id
    WHERE (a.title LIKE ? OR a.summary LIKE ? OR a.source LIKE ?)
  `;
  const params: unknown[] = [`%${query}%`, `%${query}%`, `%${query}%`];
  if (tagFilter) { sql += ` AND t2.name = ?`; params.push(tagFilter); }
  sql += ` GROUP BY a.id ORDER BY a.published_at DESC LIMIT 50`;
  const articles = db.prepare(sql).all(...params) as Article[];
  return articles.map(a => ({ ...a, tags: getArticleTags(a.id) }));
}
