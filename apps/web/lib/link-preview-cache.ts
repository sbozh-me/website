import type { LinkPreviewMeta } from "@/lib/link-preview";

/**
 * In-memory cache for /api/link-preview. It lives outside the route file because a Next.js
 * route may only export handlers and route config, not helpers like the reset below.
 */
export const linkPreviewCache = new Map<string, { meta: LinkPreviewMeta; expires: number }>();

/** Clears the in-memory cache (tests). */
export function clearLinkPreviewCache() {
  linkPreviewCache.clear();
}
