import type { LinkPreviewMeta } from "@/lib/link-preview";
import { clearPreviewImages } from "@/lib/link-preview-images";

/**
 * In-memory cache for /api/link-preview. It lives outside the route file because a Next.js
 * route may only export handlers and route config, not helpers like the reset below.
 */
export const linkPreviewCache = new Map<string, { meta: LinkPreviewMeta; expires: number }>();

/** Clears the in-memory caches, including the image proxy allowlist (tests). */
export function clearLinkPreviewCache() {
  linkPreviewCache.clear();
  clearPreviewImages();
}
