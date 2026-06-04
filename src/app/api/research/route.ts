import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sql, ResearchNote } from '@/lib/db';
import { getResearchGuidance } from '@/lib/ai';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const notes = await sql<ResearchNote[]>`
    SELECT * FROM research_notes WHERE clerk_user_id = ${userId}
    ORDER BY priority = 'high' DESC, updated_at DESC
  `;

  return NextResponse.json({
    notes: notes.map(n => ({
      ...n,
      id: Number(n.id),
      tags: JSON.parse(n.tags as unknown as string || '[]'),
      linked_articles: JSON.parse(n.linked_articles as unknown as string || '[]'),
    })),
  });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  if (body.action === 'guidance') {
    const allNotes = await sql<{ content: string; tags: string }[]>`
      SELECT content, tags FROM research_notes WHERE clerk_user_id = ${userId} AND status != 'done'
    `;
    const combinedNotes = allNotes.map(n => n.content).join('\n---\n');
    const allTags = allNotes.flatMap(n => JSON.parse(n.tags || '[]') as string[]);
    const guidance = await getResearchGuidance(combinedNotes, [...new Set(allTags)]);
    return NextResponse.json({ guidance });
  }

  const { title, content, status, priority, tags, linked_articles } = body;
  const rows = await sql<{ id: number }[]>`
    INSERT INTO research_notes (clerk_user_id, title, content, status, priority, tags, linked_articles)
    VALUES (
      ${userId}, ${title || 'Untitled'}, ${content || ''},
      ${status || 'active'}, ${priority || 'medium'},
      ${JSON.stringify(tags || [])}, ${JSON.stringify(linked_articles || [])}
    )
    RETURNING id
  `;
  return NextResponse.json({ id: Number(rows[0].id) });
}

export async function PUT(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, title, content, status, priority, tags, linked_articles } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const existing = await sql`SELECT id FROM research_notes WHERE id = ${id} AND clerk_user_id = ${userId}`;
  if (!existing.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await sql`
    UPDATE research_notes
    SET title = ${title}, content = ${content}, status = ${status}, priority = ${priority},
        tags = ${JSON.stringify(tags || [])}, linked_articles = ${JSON.stringify(linked_articles || [])},
        updated_at = NOW()
    WHERE id = ${id} AND clerk_user_id = ${userId}
  `;
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const existing = await sql`SELECT id FROM research_notes WHERE id = ${id} AND clerk_user_id = ${userId}`;
  if (!existing.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await sql`DELETE FROM research_notes WHERE id = ${id} AND clerk_user_id = ${userId}`;
  return NextResponse.json({ success: true });
}
