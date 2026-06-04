import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';
import { getTagWeights } from '@/lib/recommendations';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const allTags = await sql<{ id: number; name: string; color: string }[]>`SELECT * FROM tags ORDER BY name`;
  const weights = await getTagWeights(userId);
  const weightMap = Object.fromEntries(weights.map(w => [w.tag_name, w.weight]));

  return NextResponse.json({
    tags: allTags.map(t => ({ ...t, id: Number(t.id), weight: weightMap[t.name] || 0 })),
  });
}
