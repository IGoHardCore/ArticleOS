import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  // Read from per-user settings first, then global fallback
  const userRow = db.prepare('SELECT value FROM user_settings WHERE clerk_user_id = ? AND key = ?').get(userId, 'api_key') as { value: string } | undefined;
  const globalRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('api_key') as { value: string } | undefined;
  const key = userRow?.value || globalRow?.value || process.env.GOOGLE_API_KEY || '';
  if (!key) return NextResponse.json({ error: 'No API key configured' }, { status: 400 });

  try {
    // API key passed as header, not URL parameter, to avoid logging in request URLs
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
      headers: { 'x-goog-api-key': key },
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: 'API request failed' }, { status: res.status });

    const models = (data.models || []).map((m: { name: string; supportedGenerationMethods?: string[] }) => ({
      name: m.name,
      methods: m.supportedGenerationMethods,
    }));
    return NextResponse.json({ models });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 });
  }
}
