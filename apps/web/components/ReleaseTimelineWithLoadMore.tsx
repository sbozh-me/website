"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import type { ReleaseListItem } from "@sbozh/release-notes/types";
import { ReleaseTimeline } from "@sbozh/release-notes/components";
import { Button } from "@sbozh/react-ui/components/ui/button";
import type { LoadMoreReleasesResponse } from "@/app/api/releases/route";

interface LoadedRelease {
  release: ReleaseListItem;
  summaryHtml: string;
}

interface ReleaseTimelineWithLoadMoreProps {
  /** Initial releases from server-side render */
  initialReleases: ReleaseListItem[];
  /** Pre-rendered MDX summaries for initial releases */
  initialSummaries: Record<string, ReactNode>;
  /** Number of releases to load per page */
  pageSize?: number;
  /** Total releases available (for determining if more exist) */
  hasMore?: boolean;
}

export function ReleaseTimelineWithLoadMore({
  initialReleases,
  initialSummaries,
  pageSize = 3,
  hasMore: initialHasMore = true,
}: ReleaseTimelineWithLoadMoreProps) {
  const [loadedReleases, setLoadedReleases] = useState<LoadedRelease[]>([]);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoadMore = async () => {
    setError(null);
    setIsLoading(true);

    const offset = initialReleases.length + loadedReleases.length;

    try {
      const response = await fetch(`/api/releases?offset=${offset}&limit=${pageSize}`);
      const result: LoadMoreReleasesResponse = await response.json();

      if (result.success) {
        const newReleases = result.releases.map((release) => ({
          release,
          summaryHtml: result.summaryHtml[release.id] || "",
        }));
        setLoadedReleases((prev) => [...prev, ...newReleases]);
        setHasMore(result.hasMore);
      } else {
        setError(result.error);
      }
    } catch {
      setError("Failed to load releases");
    } finally {
      setIsLoading(false);
    }
  };

  // Combine initial and loaded releases for display
  const allReleases = [
    ...initialReleases,
    ...loadedReleases.map((lr) => lr.release),
  ];

  // Build summaries map - ReactNode for initial, HTML string rendered for loaded
  const allSummaries: Record<string, ReactNode> = { ...initialSummaries };
  for (const { release, summaryHtml } of loadedReleases) {
    if (summaryHtml) {
      allSummaries[release.id] = (
        <div dangerouslySetInnerHTML={{ __html: summaryHtml }} />
      );
    }
  }

  return (
    <div className="w-full">
      <ReleaseTimeline releases={allReleases} summaries={allSummaries} />

      {hasMore && (
        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}

      {error && (
        <p className="text-center text-sm text-destructive mt-4">{error}</p>
      )}
    </div>
  );
}
