// Link hover previews: which links get one, and how a page's OpenGraph tags become the preview.

// Absolute links to the production site count as internal on any host (localhost, previews),
// and the preview is served by whichever host the reader is on
export const SITE_ORIGINS = new Set(["https://sbozh.me", "https://www.sbozh.me"]);

// The site-wide fallback from the root layout — a page that only has this has no image of its own
const DEFAULT_OG_IMAGE = "/ogdefault.png";

export interface LinkPreviewMeta {
  /** Same-site images are root-relative so the current host serves them */
  image: string | null;
  title: string | null;
}

/**
 * Maps a link to the site path whose preview it shows.
 * Returns null for external links, links to the current page, API routes and files.
 */
export function getLinkPreviewPath(href: string, currentHref: string): string | null {
  let url: URL;
  let current: URL;
  try {
    current = new URL(currentHref);
    url = new URL(href, current);
  } catch {
    return null;
  }

  if (url.origin !== current.origin && !SITE_ORIGINS.has(url.origin)) return null;

  const { pathname } = url;
  if (pathname === current.pathname) return null;
  if (pathname.startsWith("/api/") || pathname.startsWith("/_next/")) return null;
  // Feeds, PDFs and other files have no page to preview
  if (/\.[a-z0-9]+$/i.test(pathname)) return null;

  return pathname + url.search;
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  quot: '"',
  apos: "'",
  lt: "<",
  gt: ">",
};

function decodeEntities(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === "#") {
      const n = code[1] === "x" || code[1] === "X" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isNaN(n) ? match : String.fromCodePoint(n);
    }
    return ENTITIES[code.toLowerCase()] ?? match;
  });
}

function attribute(tag: string, name: string): string | null {
  const match = tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i"));
  return match ? decodeEntities(match[1] ?? match[2]) : null;
}

/** Reads og:image and og:title (falling back to <title>) from a page's HTML. */
export function parseOpenGraph(html: string, pageUrl: string): LinkPreviewMeta {
  const headEnd = html.search(/<\/head>/i);
  const head = headEnd === -1 ? html : html.slice(0, headEnd);

  const meta: Record<string, string> = {};
  for (const tag of head.match(/<meta\b[^>]*>/gi) ?? []) {
    const key = attribute(tag, "property") ?? attribute(tag, "name");
    const content = attribute(tag, "content");
    if (key && content && !(key in meta)) meta[key] = content;
  }

  const title =
    meta["og:title"] ?? head.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? null;

  return {
    image: normalizeImage(meta["og:image"], pageUrl),
    title: title ? decodeEntities(title) : null,
  };
}

function normalizeImage(image: string | undefined, pageUrl: string): string | null {
  if (!image) return null;

  let url: URL;
  try {
    url = new URL(image, pageUrl);
  } catch {
    return null;
  }

  const sameSite = url.origin === new URL(pageUrl).origin || SITE_ORIGINS.has(url.origin);
  if (!sameSite) return url.href;
  if (url.pathname === DEFAULT_OG_IMAGE) return null;
  return url.pathname + url.search;
}
