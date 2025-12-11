import { NextRequest, NextResponse } from "next/server";

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

  try {
    const response = await fetch(assetUrl, {
      headers: directusToken
        ? { Authorization: `Bearer ${directusToken}` }
        : {},
      cache: "no-store",
    });

    if (!response.ok) {
      return new NextResponse("Asset not found", { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Failed to fetch asset", { status: 500 });
  }
}
