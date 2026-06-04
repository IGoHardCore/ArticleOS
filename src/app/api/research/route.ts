import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, ResearchNote } from '@/lib/db';
import { getResearchGuidance } from '@/lib/ai';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: notes } = await db
    .from('research_notes')
    .select('*')
    .eq('clerk_user_id', userId)
    .order('updated_at', { ascending: false });

  return NextResponse.json({
    notes: (notes ?? []).map((n: ResearchNote & { tags: string; linked_articles: string }) => ({
      ...n,
      id: Number(n.id),
      tags: typeof n.tags === 'string' ? JSON.parse(n.tags || '[]') : n.tags,
      linked_articles: typeof n.linked_articles === 'string' ? JSON.parse(n.linked_articles || '[]') : n.linked_articles,
    })),
  });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  if (body.action === 'guidance') {
    const { data: allNotes } = await db
      .from('research_notes')
      .select('content, tags')
      .eq('clerk_user_id', userId)
      .neq('status', 'done');
    const combinedNotes = (allNotes ?? []).map((n: { content: string }) => n.content).join('\n---\n');
    const allTags = (allNotes ?? []).flatMap((n: { tags: string }) => {
      try { return JSON.parse(n.tags || '[]') as string[]; } catch { return []; }
    });
    const guidance = await getResearchGuidance(combinedNotes, [...new Set(allTags)]);
    return NextResponse.json({ guidance });
  }

  const { title, content, status, priority, tags, linked_articles } = body;
  const { data } = await db.from('research_notes').insert({
    clerk_user_id: userId,
    title: title || 'Untitled',
    content: content || '',
    status: status || 'active',
    priority: priority || 'medium',
    tags: JSON.stringify(tags || []),
    linked_articles: JSON.stringify(linked_articles || []),
  }).select('id').single();

  return NextResponse.json({ id: Number((data as { id: number }).id) });
}

export async function PUT(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, title, content, status, priority, tags, linked_articles } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { data: existing } = await db.from('research_notes').select('id').match({ id, clerk_user_id: userId }).maybeSingle();
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db.from('research_notes').update({
    title, content, status, priority,
    tags: JSON.stringify(tags || []),
    linked_articles: JSON.stringify(linked_articles || []),
    updated_at: new Date().toISOString(),
  }).match({ id, clerk_user_id: userId });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { data: existing } = await db.from('research_notes').select('id').match({ id, clerk_user_id: userId }).maybeSingle();
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db.from('research_notes').delete().match({ id, clerk_user_id: userId });
  return NextResponse.json({ success: true });
}
