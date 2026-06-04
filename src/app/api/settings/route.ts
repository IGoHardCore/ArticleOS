import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await sql<{ key: string; value: string }[]>`
    SELECT key, value FROM user_settings WHERE clerk_user_id = ${userId}
  `;
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

  const body = await req.json();
  const ALLOWED_KEYS = new Set(['api_key', 'mistral_api_key']);

  for (const [key, value] of Object.entries(body)) {
    if (ALLOWED_KEYS.has(key) && typeof value === 'string') {
      await sql`
        INSERT INTO user_settings (clerk_user_id, key, value) VALUES (${userId}, ${key}, ${value})
        ON CONFLICT (clerk_user_id, key) DO UPDATE SET value = EXCLUDED.value
      `;
    }
  }
  return NextResponse.json({ success: true });
}
