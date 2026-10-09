import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const buckets = new Map<string, { count: number; resetAt: number }>();
const distributedLimiters = new Map<string, Ratelimit>();

export function getClientRateLimitKey(req: Request, scope: string, identifier?: string): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const clientIp =
    forwarded?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    req.headers.get("cf-connecting-ip")?.trim() ||
    req.headers.get("true-client-ip")?.trim() ||
    "unknown";

  const normalizedIdentifier = typeof identifier === "string" ? identifier.toLowerCase().trim() : undefined;
  return normalizedIdentifier ? `${scope}:${clientIp}:${normalizedIdentifier}` : `${scope}:${clientIp}`;
}

function localRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    if (buckets.size >= 10_000) {
      for (const [entry, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(entry);
      if (buckets.size >= 10_000) return true;
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  current.count += 1;
  return current.count > limit;
}

export async function isRateLimited(key: string, limit: number, windowMs: number): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return localRateLimited(key, limit, windowMs);
  }

  const limiterKey = `${limit}:${windowMs}`;
  let limiter = distributedLimiters.get(limiterKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
      prefix: "certitask",
    });
    distributedLimiters.set(limiterKey, limiter);
  }

  try {
    const result = await limiter.limit(key);
    return !result.success;
  } catch {
    if (process.env.NODE_ENV === "production") return true;
    return localRateLimited(key, limit, windowMs);
  }
}
