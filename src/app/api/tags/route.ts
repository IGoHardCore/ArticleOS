import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { getTagWeights } from '@/lib/recommendations';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [{ data: allTags }, weights] = await Promise.all([
    db.from('tags').select('id, name, color').order('name'),
    getTagWeights(userId),
  ]);

  const weightMap = Object.fromEntries(weights.map(w => [w.tag_name, w.weight]));
  return NextResponse.json({
    tags: (allTags ?? []).map((t: { id: number; name: string; color: string }) => ({
      ...t,
      weight: weightMap[t.name] || 0,
    })),
  });
}
