import { NextRequest, NextResponse } from "next/server";
import { type LinkPreviewMeta, parseOpenGraph } from "@/lib/link-preview";

export const runtime = "nodejs";

const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX_ENTRIES = 500;
const FETCH_TIMEOUT_MS = 5000;
// Next streams metadata into <body> for browsers; crawlers get it blocking in <head>
const CRAWLER_USER_AGENT = "sbozh-link-preview (facebookexternalhit)";

const cache = new Map<string, { meta: LinkPreviewMeta; expires: number }>();

/** Clears the in-memory cache (tests). */
export function clearLinkPreviewCache() {
  cache.clear();
}

// Pages are fetched from this same server: straight to the app's port in the container,
// or the request's own origin in dev
function internalOrigin(request: NextRequest): string {
  return process.env.PORT ? `http://127.0.0.1:${process.env.PORT}` : request.nextUrl.origin;
}

async function loadMeta(origin: string, path: string): Promise<LinkPreviewMeta | null> {
  const pageUrl = new URL(path, origin);
  const response = await fetch(pageUrl, {
    headers: { accept: "text/html", "user-agent": CRAWLER_USER_AGENT },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  // Redirects are followed, but only within this server
  if (!response.ok || new URL(response.url).origin !== origin) return null;
  if (!response.headers.get("content-type")?.includes("text/html")) return null;

  return parseOpenGraph(await response.text(), response.url);
}

/**
 * GET /api/link-preview?path=/blog/some-post
 * Returns the OpenGraph image and title of an internal page for link hover previews.
 */
export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path");
  if (!path || !path.startsWith("/") || path.startsWith("//") || path.startsWith("/api/")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const now = Date.now();
  const cached = cache.get(path);
  if (cached && cached.expires > now) {
    return NextResponse.json(cached.meta, { headers: { "Cache-Control": "public, max-age=600" } });
  }

  let meta: LinkPreviewMeta | null;
  try {
    meta = await loadMeta(internalOrigin(request), path);
  } catch {
    meta = null;
  }

  if (!meta) {
    return NextResponse.json({ error: "No preview" }, { status: 404 });
  }

  if (cache.size >= CACHE_MAX_ENTRIES) {
    cache.delete(cache.keys().next().value!);
  }
  cache.set(path, { meta, expires: now + CACHE_TTL_MS });

  return NextResponse.json(meta, { headers: { "Cache-Control": "public, max-age=600" } });
}
