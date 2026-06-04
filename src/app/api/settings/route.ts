import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const rows = db.prepare('SELECT key, value FROM user_settings WHERE clerk_user_id = ?').all(userId) as { key: string; value: string }[];
  const settings: Record<string, string> = Object.fromEntries(rows.map(r => [r.key, r.value]));

  if (settings.mistral_api_key) {
    settings.mistral_api_key_hint = '••••' + settings.mistral_api_key.slice(-4);
    delete settings.mistral_api_key;
  }
  if (settings.api_key) {
    settings.api_key_hint = '••••' + settings.api_key.slice(-4);
    delete settings.api_key;
  }

  settings.active_provider = settings.mistral_api_key_hint
    ? 'mistral'
    : settings.api_key_hint
    ? 'google'
    : '';

  return NextResponse.json(settings);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const body = await req.json();
  const upsert = db.prepare('INSERT OR REPLACE INTO user_settings (clerk_user_id, key, value) VALUES (?, ?, ?)');
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === 'string') upsert.run(userId, key, value);
  }
  return NextResponse.json({ success: true });
}
