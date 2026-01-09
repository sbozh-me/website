"use client";

import { useState, useTransition, type ReactNode } from "react";
import Markdown from "react-markdown";
import type { ReleaseListItem } from "@sbozh/release-notes/types";
import { ReleaseTimelineEntry } from "@sbozh/release-notes/components";
import { Button } from "@sbozh/react-ui/components/ui/button";
import { loadMoreReleases } from "@/lib/releases/actions";

interface ReleaseTimelineWithLoadMoreProps {
  initialReleases: ReleaseListItem[];
  initialSummaries: Record<string, ReactNode>;
  initialHasMore: boolean;
}

export function ReleaseTimelineWithLoadMore({
  initialReleases,
  initialSummaries,
  initialHasMore,
}: ReleaseTimelineWithLoadMoreProps) {
  const [releases, setReleases] = useState(initialReleases);
  const [summaries, setSummaries] = useState(initialSummaries);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleLoadMore = () => {
    startTransition(async () => {
      setError(null);
      const result = await loadMoreReleases(releases.length);

      if (result.success) {
        setReleases((prev) => [...prev, ...result.releases]);
        // Create summaries for new releases using react-markdown
        const newSummaries: Record<string, ReactNode> = {};
        for (const release of result.releases) {
          if (release.summary) {
            newSummaries[release.id] = (
              <Markdown>{release.summary}</Markdown>
            );
          }
        }
        setSummaries((prev) => ({ ...prev, ...newSummaries }));
        setHasMore(result.hasMore);
      } else {
        setError(result.error);
      }
    });
  };

  if (releases.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <section className="w-full">
        {releases.map((release) => (
          <ReleaseTimelineEntry
            key={release.id}
            release={release}
            summaryContent={summaries[release.id]}
          />
        ))}
      </section>

      {error && (
        <p className="mt-4 text-sm text-destructive">{error}</p>
      )}

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isPending}
          >
            {isPending ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
