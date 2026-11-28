"use client";

import { useState, useTransition, useCallback } from "react";
import { ReleaseTimeline } from "@sbozh/release-notes/components";
import type { ReleaseListItem } from "@sbozh/release-notes/types";
import { Button } from "@sbozh/react-ui/components/ui/button";
import { loadMoreReleases } from "@/lib/releases/actions";

interface ReleaseTimelineWithLoadMoreProps {
  initialReleases: ReleaseListItem[];
  initialHasMore: boolean;
  currentVersion: string;
  projectSlug?: string;
}

export function ReleaseTimelineWithLoadMore({
  initialReleases,
  initialHasMore,
  currentVersion,
  projectSlug,
}: ReleaseTimelineWithLoadMoreProps) {
  const [releases, setReleases] = useState(initialReleases);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();

  const handleLoadMore = useCallback(() => {
    startTransition(async () => {
      const result = await loadMoreReleases(releases.length, projectSlug);

      if (result.success) {
        setReleases((prev) => [...prev, ...result.releases]);
        setHasMore(result.hasMore);
      }
    });
  }, [releases.length, projectSlug]);

  return (
    <>
      <ReleaseTimeline releases={releases} currentVersion={currentVersion} />
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
