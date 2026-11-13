import { NextRequest, NextResponse } from "next/server";
import { isPreviewImageAllowed } from "@/lib/link-preview-images";
import { safeFetch } from "@/lib/safe-fetch";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;
// SVG can carry scripts if opened directly from this origin, so only raster formats pass
const ALLOWED_TYPES = /^image\/(png|jpe?g|gif|webp|avif)$/i;

/**
 * GET /api/link-preview/image?url=https://example.com/og.png
 * Serves an external OG image from this site, so the CSP stays 'self' and readers' browsers
 * never contact the linked site. Only images found by /api/link-preview are served.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url || !isPreviewImageAllowed(url)) {
    return new NextResponse(null, { status: 404 });
  }

  let response;
  try {
    response = await safeFetch(url, {
      accept: "image/avif,image/webp,image/png,image/jpeg,image/gif",
      userAgent: "sbozh-link-preview",
      maxBytes: MAX_BYTES,
    });
  } catch {
    response = null;
  }

  const type = response?.contentType.split(";")[0].trim() ?? "";
  if (
    !response ||
    response.status < 200 ||
    response.status >= 300 ||
    response.truncated ||
    !ALLOWED_TYPES.test(type)
  ) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(new Uint8Array(response.body), {
    headers: {
      "Content-Type": type,
      "Cache-Control": "public, max-age=86400",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
