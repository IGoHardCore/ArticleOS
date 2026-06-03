import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { analyzeArticle } from '@/lib/ai';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = parseInt(id);
  if (isNaN(numId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const db = getDb();
  const article = db.prepare('SELECT id, title, full_text, summary FROM articles WHERE id = ?').get(numId) as
    { id: number; title: string; full_text: string | null; summary: string | null } | undefined;

  if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (article.summary) return NextResponse.json({ summary: article.summary });

  try {
    const result = await analyzeArticle(article.title, article.full_text || article.title);
    if (result.summary) {
      db.prepare('UPDATE articles SET summary = ? WHERE id = ?').run(result.summary, numId);
    }
    // Insert any new tags
    for (const tagName of result.tags) {
      const tag = db.prepare('SELECT id FROM tags WHERE name = ?').get(tagName) as { id: number } | undefined;
      if (tag) db.prepare('INSERT OR IGNORE INTO article_tags (article_id, tag_id) VALUES (?, ?)').run(numId, tag.id);
    }
    return NextResponse.json({ summary: result.summary, tags: result.tags });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 });
  }
}
