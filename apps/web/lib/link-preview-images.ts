// External OG images the image proxy may serve. Only images found by a real preview lookup
// get in, so /api/link-preview/image can't be used as an open proxy. Kept on globalThis
// so both API routes share it even when bundled separately.

const TTL_MS = 60 * 60 * 1000;
const MAX_ENTRIES = 1000;

const store: Map<string, number> = ((globalThis as { __linkPreviewImages?: Map<string, number> })
  .__linkPreviewImages ??= new Map());

export function allowPreviewImage(url: string, now = Date.now()) {
  store.delete(url);
  if (store.size >= MAX_ENTRIES) store.delete(store.keys().next().value!);
  store.set(url, now + TTL_MS);
}

export function isPreviewImageAllowed(url: string, now = Date.now()): boolean {
  const expires = store.get(url);
  return expires !== undefined && expires > now;
}

/** Proxied URL for an external image, served from this site so the CSP stays 'self'. */
export function proxiedImageUrl(url: string): string {
  return `/api/link-preview/image?${new URLSearchParams({ url })}`;
}

/** Clears the store (tests). */
export function clearPreviewImages() {
  store.clear();
}
