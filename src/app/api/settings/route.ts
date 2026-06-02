import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  const settings = Object.fromEntries(rows.map(r => [r.key, r.value]));
  if (settings.api_key) settings.api_key = '••••••••' + settings.api_key.slice(-4);
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
