import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDb, ResearchNote } from '@/lib/db';
import { getResearchGuidance } from '@/lib/ai';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const notes = db.prepare(
    "SELECT * FROM research_notes WHERE clerk_user_id = ? ORDER BY priority = 'high' DESC, updated_at DESC"
  ).all(userId) as ResearchNote[];

  return NextResponse.json({
    notes: notes.map(n => ({
      ...n,
      tags: JSON.parse(n.tags as unknown as string || '[]'),
      linked_articles: JSON.parse(n.linked_articles as unknown as string || '[]'),
    })),
  });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const body = await req.json();

  if (body.action === 'guidance') {
    const allNotes = db.prepare(
      "SELECT content, tags FROM research_notes WHERE clerk_user_id = ? AND status != 'done'"
    ).all(userId) as { content: string; tags: string }[];
    const combinedNotes = allNotes.map(n => n.content).join('\n---\n');
    const allTags = allNotes.flatMap(n => JSON.parse(n.tags || '[]') as string[]);
    const guidance = await getResearchGuidance(combinedNotes, [...new Set(allTags)]);
    return NextResponse.json({ guidance });
  }

  const { title, content, status, priority, tags, linked_articles } = body;
  const result = db.prepare(`
    INSERT INTO research_notes (clerk_user_id, title, content, status, priority, tags, linked_articles)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(userId, title || 'Untitled', content || '', status || 'active', priority || 'medium', JSON.stringify(tags || []), JSON.stringify(linked_articles || []));
  return NextResponse.json({ id: result.lastInsertRowid });
}

export async function PUT(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const { id, title, content, status, priority, tags, linked_articles } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  // Verify ownership before updating
  const existing = db.prepare('SELECT id FROM research_notes WHERE id = ? AND clerk_user_id = ?').get(id, userId);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  db.prepare(`
    UPDATE research_notes
    SET title = ?, content = ?, status = ?, priority = ?, tags = ?, linked_articles = ?, updated_at = datetime('now')
    WHERE id = ? AND clerk_user_id = ?
  `).run(title, content, status, priority, JSON.stringify(tags || []), JSON.stringify(linked_articles || []), id, userId);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  // Verify ownership before deleting
  const existing = db.prepare('SELECT id FROM research_notes WHERE id = ? AND clerk_user_id = ?').get(id, userId);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  db.prepare('DELETE FROM research_notes WHERE id = ? AND clerk_user_id = ?').run(id, userId);
  return NextResponse.json({ success: true });
}
