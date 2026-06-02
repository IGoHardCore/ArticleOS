import { NextRequest, NextResponse } from 'next/server';
import { getDb, ResearchNote } from '@/lib/db';
import { getResearchGuidance } from '@/lib/ai';

export async function GET() {
  const db = getDb();
  const notes = db.prepare("SELECT * FROM research_notes ORDER BY priority = 'high' DESC, updated_at DESC").all() as ResearchNote[];
  return NextResponse.json({
    notes: notes.map(n => ({
      ...n,
      tags: JSON.parse(n.tags as unknown as string || '[]'),
      linked_articles: JSON.parse(n.linked_articles as unknown as string || '[]'),
    })),
  });
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();

  if (body.action === 'guidance') {
    const allNotes = db.prepare("SELECT content, tags FROM research_notes WHERE status != 'done'").all() as { content: string; tags: string }[];
    const combinedNotes = allNotes.map(n => n.content).join('\n---\n');
    const allTags = allNotes.flatMap(n => JSON.parse(n.tags || '[]') as string[]);
    const guidance = await getResearchGuidance(combinedNotes, [...new Set(allTags)]);
    return NextResponse.json({ guidance });
  }

  const { title, content, status, priority, tags, linked_articles } = body;
  const result = db.prepare(`
    INSERT INTO research_notes (title, content, status, priority, tags, linked_articles)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(title || 'Untitled', content || '', status || 'active', priority || 'medium', JSON.stringify(tags || []), JSON.stringify(linked_articles || []));
  return NextResponse.json({ id: result.lastInsertRowid });
}

export async function PUT(req: NextRequest) {
  const db = getDb();
  const { id, title, content, status, priority, tags, linked_articles } = await req.json();
  db.prepare(`
    UPDATE research_notes
    SET title = ?, content = ?, status = ?, priority = ?, tags = ?, linked_articles = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(title, content, status, priority, JSON.stringify(tags || []), JSON.stringify(linked_articles || []), id);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const db = getDb();
  const { id } = await req.json();
  db.prepare('DELETE FROM research_notes WHERE id = ?').run(id);
  return NextResponse.json({ success: true });
}
