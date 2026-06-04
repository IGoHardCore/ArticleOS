import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userRows = await sql<{ value: string }[]>`
    SELECT value FROM user_settings WHERE clerk_user_id = ${userId} AND key = 'api_key'
  `;
  const globalRows = await sql<{ value: string }[]>`SELECT value FROM settings WHERE key = 'api_key'`;
  const key = userRows[0]?.value || globalRows[0]?.value || process.env.GOOGLE_API_KEY || '';
  if (!key) return NextResponse.json({ error: 'No API key configured' }, { status: 400 });

  try {
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
