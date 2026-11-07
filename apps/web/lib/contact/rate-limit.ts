// A small in-memory sliding-window limiter. One web container serves
// sbozh.me, so process memory is enough; a restart simply forgets the window.
//
// The contact route uses the default instance (`rateLimited`); other routes
// build their own with `createRateLimiter` so their budgets stay separate.

/** Per-key: at most RATE_LIMIT hits per RATE_WINDOW_MS (contact form). */
export const RATE_LIMIT = 5;
export const RATE_WINDOW_MS = 10 * 60 * 1000;

export interface RateLimiter {
  /** Records a hit and returns true when the key is over the limit. */
  readonly hit: (key: string, now?: number) => boolean;
  readonly reset: () => void;
}

export function createRateLimiter(limit: number, windowMs: number): RateLimiter {
  const hits = new Map<string, number[]>();

  return {
    hit(key, now = Date.now()) {
      const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return true;
      }
      recent.push(now);
      hits.set(key, recent);
      // Keep the map from growing without bound on a long-lived process.
      if (hits.size > 5000) {
        for (const [k, times] of hits) {
          if (times.every((t) => now - t >= windowMs)) hits.delete(k);
        }
      }
      return false;
    },
    reset() {
      hits.clear();
    },
  };
}

const contactLimiter = createRateLimiter(RATE_LIMIT, RATE_WINDOW_MS);

/** Records a hit and returns true when the key is over the limit. */
export function rateLimited(key: string, now: number = Date.now()): boolean {
  return contactLimiter.hit(key, now);
}

/** Test hook — the limiter is module state. */
export function resetRateLimit(): void {
  contactLimiter.reset();
}

/** The caller's IP as nginx forwards it. */
export function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
