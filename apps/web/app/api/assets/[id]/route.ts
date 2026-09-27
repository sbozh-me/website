import { NextRequest, NextResponse } from "next/server";

// Request headers forwarded to Directus so byte-range requests work
// (Safari/iOS will not play <video> without 206 Partial Content support)
const FORWARDED_REQUEST_HEADERS = ["range", "if-range"];

// Response headers passed back to the client
const FORWARDED_RESPONSE_HEADERS = [
  "content-length",
  "content-range",
  "accept-ranges",
  "etag",
  "last-modified",
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const directusUrl = process.env.DIRECTUS_URL;
  const directusToken = process.env.DIRECTUS_TOKEN;

  if (!directusUrl) {
    return new NextResponse("Directus not configured", { status: 500 });
  }

  const assetUrl = `${directusUrl}/assets/${id}`;

  const headers: Record<string, string> = {};
  if (directusToken) {
    headers.Authorization = `Bearer ${directusToken}`;
  }
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers[name] = value;
  }

  try {
    const response = await fetch(assetUrl, { headers, cache: "no-store" });

    // 416 Range Not Satisfiable is a valid answer to a range request
    if (!response.ok && response.status !== 416) {
      return new NextResponse("Asset not found", { status: response.status });
    }

    const responseHeaders = new Headers({
      "Content-Type": response.headers.get("content-type") || "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    });
    for (const name of FORWARDED_RESPONSE_HEADERS) {
      const value = response.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }

    // Stream the body instead of buffering whole files (videos) in memory
    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch {
    return new NextResponse("Failed to fetch asset", { status: 500 });
  }
}
