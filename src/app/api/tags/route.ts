import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDb } from '@/lib/db';
import { getTagWeights } from '@/lib/recommendations';

export async function GET() {
  const { userId } = await auth();
  const db = getDb();
  const allTags = db.prepare('SELECT * FROM tags ORDER BY name').all() as { id: number; name: string; color: string }[];
  const weights = getTagWeights(userId ?? undefined);
  const weightMap = Object.fromEntries(weights.map(w => [w.tag_name, w.weight]));

  return NextResponse.json({
    tags: allTags.map(t => ({ ...t, weight: weightMap[t.name] || 0 })),
  });
}
