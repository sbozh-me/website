import { NextResponse } from "next/server";
import { createReleaseRepository, DirectusError } from "@/lib/releases/repository";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const offset = parseInt(searchParams.get("offset") || "0", 10);
  const limit = parseInt(searchParams.get("limit") || "3", 10);

  try {
    const repository = createReleaseRepository();
    if (!repository) {
      return NextResponse.json(
        { error: "Repository not configured" },
        { status: 503 }
      );
    }

    const releases = await repository.getReleases({ offset, limit });

    return NextResponse.json({
      releases,
      hasMore: releases.length === limit,
    });
  } catch (error) {
    console.error("Failed to fetch releases:", error);
    if (error instanceof DirectusError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status || 500 }
      );
    }
    return NextResponse.json(
      { error: "Unable to load releases" },
      { status: 500 }
    );
  }
}
