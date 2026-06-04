// Simple in-memory rate limiter. Per-user, sliding window.
// For multi-instance deploys, replace with Redis/Upstash.

interface Bucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, Bucket>();

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
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

// Prune stale buckets every 10 minutes to avoid memory growth
setInterval(() => {
  const cutoff = Date.now() - 10 * 60 * 1000;
  for (const [key, bucket] of buckets) {
    if (bucket.lastRefill < cutoff) buckets.delete(key);
  }
}, 10 * 60 * 1000);
