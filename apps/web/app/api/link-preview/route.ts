import { NextRequest, NextResponse } from "next/server";
import { type LinkPreviewMeta, parseOpenGraph, SITE_ORIGINS } from "@/lib/link-preview";
import { linkPreviewCache } from "@/lib/link-preview-cache";
import { allowPreviewImage, proxiedImageUrl } from "@/lib/link-preview-images";
import { parsePublicUrl, safeFetch } from "@/lib/safe-fetch";

export const runtime = "nodejs";

const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX_ENTRIES = 500;
const FETCH_TIMEOUT_MS = 5000;
// Enough for any <head>; the rest of a page is never needed
const EXTERNAL_MAX_BYTES = 512 * 1024;
// Next streams metadata into <body> for browsers; crawlers get it blocking in <head>.
// External sites also serve OpenGraph tags reliably to crawlers.
const CRAWLER_USER_AGENT = "sbozh-link-preview (facebookexternalhit)";
const CACHE_HEADERS = { "Cache-Control": "public, max-age=600" };

// Kept outside this file: a Next.js route may only export handlers and route config
const cache = linkPreviewCache;

// Pages are fetched from this same server: straight to the app's port in the container,
// or the request's own origin in dev
function internalOrigin(request: NextRequest): string {
  return process.env.PORT ? `http://127.0.0.1:${process.env.PORT}` : request.nextUrl.origin;
}

async function loadInternalMeta(origin: string, path: string): Promise<LinkPreviewMeta | null> {
  const pageUrl = new URL(path, origin);
  const response = await fetch(pageUrl, {
    headers: { accept: "text/html", "user-agent": CRAWLER_USER_AGENT },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  // Redirects are followed, but only within this server
  if (!response.ok || new URL(response.url).origin !== origin) return null;
  if (!response.headers.get("content-type")?.includes("text/html")) return null;

  return parseOpenGraph(await response.text(), response.url, { internal: true });
}

function decodeHtml(body: Buffer, contentType: string): string {
  const charset = contentType.match(/charset=["']?([\w-]+)/i)?.[1] ?? "utf-8";
  try {
    return new TextDecoder(charset).decode(body);
  } catch {
    return new TextDecoder("utf-8").decode(body);
  }
}

async function loadExternalMeta(url: URL): Promise<LinkPreviewMeta | null> {
  const response = await safeFetch(url.href, {
    accept: "text/html,application/xhtml+xml",
    userAgent: CRAWLER_USER_AGENT,
    maxBytes: EXTERNAL_MAX_BYTES,
    timeoutMs: FETCH_TIMEOUT_MS,
  });
  if (!response || response.status < 200 || response.status >= 300) return null;
  if (!/text\/html|application\/xhtml\+xml/i.test(response.contentType)) return null;

  const meta = parseOpenGraph(decodeHtml(response.body, response.contentType), response.url);

  // External images are served through the proxy so the site CSP stays 'self'
  let image = meta.image;
  if (image && /^https?:/i.test(image)) {
    if (parsePublicUrl(image)) {
      allowPreviewImage(image);
      image = proxiedImageUrl(image);
    } else {
      image = null;
    }
  }

  return { image, title: meta.title ?? new URL(response.url).hostname };
}

function badRequest() {
  return NextResponse.json({ error: "Invalid link" }, { status: 400 });
}

/**
 * GET /api/link-preview?path=/blog/some-post — a page of this site
 * GET /api/link-preview?url=https://example.com/page — an external page
 * Returns the OpenGraph image and title of the page for link hover previews.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const path = params.get("path");
  const rawUrl = params.get("url");

  let key: string;
  let load: () => Promise<LinkPreviewMeta | null>;
  if (path !== null) {
    if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/api/")) return badRequest();
    key = `path:${path}`;
    load = () => loadInternalMeta(internalOrigin(request), path);
  } else if (rawUrl !== null) {
    const url = parsePublicUrl(rawUrl);
    if (!url || SITE_ORIGINS.has(url.origin)) return badRequest();
    url.hash = "";
    key = `url:${url.href}`;
    load = () => loadExternalMeta(url);
  } else {
    return badRequest();
  }

  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expires > now) {
    return NextResponse.json(cached.meta, { headers: CACHE_HEADERS });
  }

  let meta: LinkPreviewMeta | null;
  try {
    meta = await load();
  } catch {
    meta = null;
  }

  if (!meta) {
    return NextResponse.json({ error: "No preview" }, { status: 404 });
  }

  if (cache.size >= CACHE_MAX_ENTRIES) {
    cache.delete(cache.keys().next().value!);
  }
  cache.set(key, { meta, expires: now + CACHE_TTL_MS });

  return NextResponse.json(meta, { headers: CACHE_HEADERS });
}
