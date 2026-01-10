"use client";

import { useState, useTransition, type ReactNode } from "react";
import { ReleaseTimeline } from "@sbozh/release-notes/components";
import type { ReleaseListItem } from "@sbozh/release-notes/types";
import { Button } from "@sbozh/react-ui/components/ui/button";
import { loadMoreReleases } from "@/lib/releases/actions";

interface ReleaseTimelineWithLoadMoreProps {
  initialReleases: ReleaseListItem[];
  initialSummaries: Record<string, ReactNode>;
  initialHasMore: boolean;
  currentVersion: string;
}

export function ReleaseTimelineWithLoadMore({
  initialReleases,
  initialSummaries,
  initialHasMore,
  currentVersion,
}: ReleaseTimelineWithLoadMoreProps) {
  const [releases, setReleases] = useState(initialReleases);
  const [summaries, setSummaries] = useState(initialSummaries);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();

  const handleLoadMore = () => {
    startTransition(async () => {
      const result = await loadMoreReleases(releases.length);

      if (result.success) {
        setReleases((prev) => [...prev, ...result.releases]);
        setSummaries((prev) => ({ ...prev, ...result.summaries }));
        setHasMore(result.hasMore);
      }
    });
  };

  return (
    <>
      <ReleaseTimeline
        releases={releases}
        summaries={summaries}
        currentVersion={currentVersion}
      />
      {hasMore && (
        <div className="flex justify-center pt-8">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isPending}
          >
            {isPending ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}
    </>
  );
}
