import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: rows } = await db.from('user_settings').select('key, value').eq('clerk_user_id', userId);
  const settings: Record<string, string> = Object.fromEntries(
    (rows ?? []).map((r: { key: string; value: string }) => [r.key, r.value])
  );

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

  const body = await req.json();
  const ALLOWED_KEYS = new Set(['api_key', 'mistral_api_key']);

  for (const [key, value] of Object.entries(body)) {
    if (ALLOWED_KEYS.has(key) && typeof value === 'string') {
      await db.from('user_settings').upsert({ clerk_user_id: userId, key, value }, { onConflict: 'clerk_user_id,key' });
    }
  }
  return NextResponse.json({ success: true });
}
