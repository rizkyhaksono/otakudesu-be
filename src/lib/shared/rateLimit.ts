/**
 * In-memory token bucket, keyed by client IP.
 *
 * This API is public and every request fans out to a third-party site, so an
 * unthrottled client can get the server's IP banned upstream. Deliberately
 * dependency-free and per-instance; swap the store for Redis if this ever runs
 * behind more than one replica.
 */

type Bucket = {
  tokens: number;
  updatedAt: number;
};

const WINDOW_MS = 60_000;
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_PER_MINUTE ?? 120);
const MAX_TRACKED_CLIENTS = 10_000;

const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  /** Seconds until the bucket has room again. */
  retryAfter: number;
  resetAt: number;
};

export function checkRateLimit(key: string, now = Date.now()): RateLimitResult {
  const refillRate = MAX_REQUESTS / WINDOW_MS;
  let bucket = buckets.get(key);

  if (!bucket) {
    // Cheap LRU-ish eviction: drop the oldest entry once the map gets large.
    if (buckets.size >= MAX_TRACKED_CLIENTS) {
      const oldest = buckets.keys().next();
      if (!oldest.done) buckets.delete(oldest.value);
    }
    bucket = { tokens: MAX_REQUESTS, updatedAt: now };
  } else {
    const elapsed = now - bucket.updatedAt;
    bucket.tokens = Math.min(MAX_REQUESTS, bucket.tokens + elapsed * refillRate);
    bucket.updatedAt = now;
    // Refresh insertion order so active clients are not evicted first.
    buckets.delete(key);
  }

  const allowed = bucket.tokens >= 1;
  if (allowed) bucket.tokens -= 1;

  buckets.set(key, bucket);

  const deficit = allowed ? 0 : 1 - bucket.tokens;
  const retryAfter = allowed ? 0 : Math.max(1, Math.ceil(deficit / refillRate / 1000));

  return {
    allowed,
    limit: MAX_REQUESTS,
    remaining: Math.max(0, Math.floor(bucket.tokens)),
    retryAfter,
    resetAt: now + retryAfter * 1000,
  };
}

/**
 * Derive a client key. Behind nginx the real address arrives in
 * `x-forwarded-for`; the first entry is the client.
 */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "RateLimit-Limit": String(result.limit),
    "RateLimit-Remaining": String(result.remaining),
    "RateLimit-Reset": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
  };
  if (!result.allowed) headers["Retry-After"] = String(result.retryAfter);
  return headers;
}

/** Test seam. */
export function __resetRateLimit() {
  buckets.clear();
}
