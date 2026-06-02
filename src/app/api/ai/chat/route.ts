import { NextRequest, NextResponse } from 'next/server';
import { generateChat } from '@/lib/ai';

export async function POST(req: NextRequest) {
  const { message, history = [] } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error: 'Empty message' }, { status: 400 });
  try {
    const response = await generateChat(message, history);
    return NextResponse.json({ response });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'AI request failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
