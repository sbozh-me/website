"use client";

import { useState, useCallback, type ReactNode } from "react";
import type { ReleaseListItem } from "../types/release";
import { ReleaseTimelineEntry } from "./ReleaseTimelineEntry";
import { LoadMoreButton } from "./LoadMoreButton";

interface LoadMoreResult {
  success: true;
  releases: ReleaseListItem[];
  htmlSummaries: Record<string, string>;
  hasMore: boolean;
}

interface LoadMoreError {
  success: false;
  error: string;
}

type LoadMoreResponse = LoadMoreResult | LoadMoreError;

interface ReleaseTimelineClientProps {
  initialReleases: ReleaseListItem[];
  initialSummaries: Record<string, ReactNode>;
  initialHasMore: boolean;
  loadMoreAction: (offset: number, limit: number) => Promise<LoadMoreResponse>;
}

export function ReleaseTimelineClient({
  initialReleases,
  initialSummaries,
  initialHasMore,
  loadMoreAction,
}: ReleaseTimelineClientProps) {
  const [releases, setReleases] = useState(initialReleases);
  const [summaries, setSummaries] = useState<Record<string, ReactNode | string>>(initialSummaries);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const result = await loadMoreAction(releases.length, 3);

      if (result.success) {
        setReleases((prev) => [...prev, ...result.releases]);
        setSummaries((prev) => ({ ...prev, ...result.htmlSummaries }));
        setHasMore(result.hasMore);
      } else {
        console.error("Failed to load more releases:", result.error);
      }
    } catch (error) {
      console.error("Error loading more releases:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, releases.length, loadMoreAction]);

  if (releases.length === 0) {
    return null;
  }

  return (
    <section className="w-full">
      {releases.map((release) => (
        <ReleaseTimelineEntry
          key={release.id}
          release={release}
          summaryContent={summaries[release.id]}
        />
      ))}
      {hasMore && (
        <LoadMoreButton onClick={handleLoadMore} isLoading={isLoading} />
      )}
    </section>
  );
}
