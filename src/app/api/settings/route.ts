import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  const settings: Record<string, string> = Object.fromEntries(rows.map(r => [r.key, r.value]));
  // Return masked key + provider type separately so UI doesn't need to detect from masked string
  if (settings.api_key) {
    const rawKey = settings.api_key;
    settings.api_key_provider = rawKey.startsWith('AIza') ? 'google' : 'other';
    settings.api_key_hint = '••••' + rawKey.slice(-4);
    delete settings.api_key;
  }
  return NextResponse.json(settings);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === 'string') upsert.run(key, value);
  }
  return NextResponse.json({ success: true });
}
