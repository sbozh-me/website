import { NextRequest, NextResponse } from "next/server";
import type { ReleaseListItem } from "@sbozh/release-notes/types";
import { createReleaseRepository, DirectusError } from "@/lib/releases/repository";

export interface LoadMoreReleasesResult {
  success: true;
  releases: ReleaseListItem[];
  summaryHtml: Record<string, string>;
  hasMore: boolean;
}

export interface LoadMoreReleasesError {
  success: false;
  error: string;
}

export type LoadMoreReleasesResponse = LoadMoreReleasesResult | LoadMoreReleasesError;

async function compileSummaryToHtml(markdown: string): Promise<string> {
  // Dynamic imports to avoid bundler issues with react-dom/server
  const { evaluate } = await import("@mdx-js/mdx");
  const runtime = await import("react/jsx-runtime");
  const { renderToStaticMarkup } = await import("react-dom/server");

  const { default: Content } = await evaluate(markdown, {
    ...runtime,
  } as Parameters<typeof evaluate>[1]);
  const element = Content({});
  return renderToStaticMarkup(element);
}

export async function GET(request: NextRequest): Promise<NextResponse<LoadMoreReleasesResponse>> {
  const searchParams = request.nextUrl.searchParams;
  const offset = parseInt(searchParams.get("offset") || "0", 10);
  const limit = parseInt(searchParams.get("limit") || "3", 10);

  try {
    const repository = createReleaseRepository();
    if (!repository) {
      return NextResponse.json({ success: true, releases: [], summaryHtml: {}, hasMore: false });
    }

    // Fetch one extra to check if there are more
    const releases = await repository.getReleases({ limit: limit + 1, offset });
    const hasMore = releases.length > limit;
    const releasesToReturn = hasMore ? releases.slice(0, limit) : releases;

    // Compile MDX summaries to HTML strings in parallel
    const summaryEntries = await Promise.all(
      releasesToReturn.map(async (release) => {
        if (!release.summary) return [release.id, ""] as const;
        const html = await compileSummaryToHtml(release.summary);
        return [release.id, html] as const;
      })
    );
    const summaryHtml = Object.fromEntries(summaryEntries);

    return NextResponse.json({ success: true, releases: releasesToReturn, summaryHtml, hasMore });
  } catch (error) {
    console.error("Failed to load more releases:", error);
    if (error instanceof DirectusError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: false, error: "Unable to load releases" }, { status: 500 });
  }
}
