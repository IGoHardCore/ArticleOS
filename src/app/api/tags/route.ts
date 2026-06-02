import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getTagWeights } from '@/lib/recommendations';

export async function GET() {
  const db = getDb();
  const tags = db.prepare('SELECT * FROM tags ORDER BY name').all();
  const weights = getTagWeights();
  const weightMap = Object.fromEntries(weights.map(w => [w.tag_name, w.weight]));
  return NextResponse.json({
    tags: (tags as { id: number; name: string; color: string }[]).map(t => ({ ...t, weight: weightMap[t.name] || 0 })),
  });
}
