import { db } from './db';

// ── In-memory sliding window (fast, per-instance) ─────────────────────────────
// Guards against burst abuse within a single serverless instance.
// NOTE: resets on cold start — the daily DB cap below is the durable backstop.

interface Bucket { tokens: number; lastRefill: number }
const buckets = new Map<string, Bucket>();

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || now - bucket.lastRefill >= windowMs) {
    bucket = { tokens: maxRequests, lastRefill: now };
  }
  if (bucket.tokens <= 0) {
    const retryAfterMs = windowMs - (now - bucket.lastRefill);
    buckets.set(key, bucket);
    return { allowed: false, retryAfterMs };
  }
  bucket.tokens -= 1;
  buckets.set(key, bucket);
  return { allowed: true, retryAfterMs: 0 };
}

setInterval(() => {
  const cutoff = Date.now() - 10 * 60 * 1000;
  for (const [key, bucket] of buckets) {
    if (bucket.lastRefill < cutoff) buckets.delete(key);
  }
}, 10 * 60 * 1000);

// ── Persistent daily cap (Supabase-backed, survives cold starts) ──────────────
// Stores { date: "YYYY-MM-DD", count: N } in user_settings.
// One row per user per action — auto-resets each calendar day.

export async function checkDailyLimit(
  userId: string,
  action: string,
  maxPerDay: number,
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const settingKey = `rl_${action}`;
  const today = new Date().toISOString().slice(0, 10);

  const { data } = await db
    .from('user_settings')
    .select('value')
    .match({ clerk_user_id: userId, key: settingKey })
    .maybeSingle();

  const stored = (() => {
    try { return JSON.parse((data as { value: string } | null)?.value ?? '{}'); }
    catch { return {}; }
  })();

  const count: number = stored.date === today ? (stored.count ?? 0) : 0;

  if (count >= maxPerDay) {
    return { allowed: false, used: count, limit: maxPerDay };
  }

  await db.from('user_settings').upsert(
    { clerk_user_id: userId, key: settingKey, value: JSON.stringify({ date: today, count: count + 1 }) },
    { onConflict: 'clerk_user_id,key' },
  );

  return { allowed: true, used: count + 1, limit: maxPerDay };
}
