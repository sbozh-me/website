// A small in-memory sliding-window limiter for the contact route. One web
// container serves sbozh.me, so process memory is enough; a restart simply
// forgets the window.

/** Per-key: at most RATE_LIMIT hits per RATE_WINDOW_MS. */
export const RATE_LIMIT = 5;
export const RATE_WINDOW_MS = 10 * 60 * 1000;

const hits = new Map<string, number[]>();

/** Records a hit and returns true when the key is over the limit. */
export function rateLimited(key: string, now: number = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  // Keep the map from growing without bound on a long-lived process.
  if (hits.size > 5000) {
    for (const [k, times] of hits) {
      if (times.every((t) => now - t >= RATE_WINDOW_MS)) hits.delete(k);
    }
  }
  return false;
}

/** Test hook — the limiter is module state. */
export function resetRateLimit(): void {
  hits.clear();
}
