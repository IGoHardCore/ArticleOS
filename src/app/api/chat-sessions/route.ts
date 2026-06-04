import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await db
    .from('chat_sessions')
    .select('id, title, created_at, updated_at, messages')
    .eq('clerk_user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const sessions = (data ?? []).map((s: {
    id: string; title: string; created_at: string; updated_at: string;
    messages: Array<{ role: string; content: string }>;
  }) => {
    const msgs = Array.isArray(s.messages) ? s.messages : [];
    const lastAssistant = [...msgs].reverse().find(m => m.role === 'assistant');
    return {
      id: s.id,
      title: s.title,
      created_at: s.created_at,
      updated_at: s.updated_at,
      preview: lastAssistant?.content?.slice(0, 100) ?? '',
      message_count: msgs.length,
    };
  });

  return NextResponse.json({ sessions });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, messages } = await req.json();
  if (!Array.isArray(messages)) return NextResponse.json({ error: 'Invalid messages' }, { status: 400 });

  const { data, error } = await db
    .from('chat_sessions')
    .insert({ clerk_user_id: userId, title: title || 'New Chat', messages })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: (data as { id: string }).id });
}
