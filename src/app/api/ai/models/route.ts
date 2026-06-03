import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('api_key') as { value: string } | undefined;
  const key = row?.value || process.env.GOOGLE_API_KEY || '';
  if (!key) return NextResponse.json({ error: 'No API key configured' }, { status: 400 });

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
    );
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data, status: res.status });

    const models = (data.models || []).map((m: { name: string; supportedGenerationMethods?: string[] }) => ({
      name: m.name,
      methods: m.supportedGenerationMethods,
    }));
    return NextResponse.json({ models });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
