"use client";

import { useState, useTransition, useCallback, type ReactNode } from "react";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import { ReleaseTimeline } from "@sbozh/release-notes/components";
import type { ReleaseListItem } from "@sbozh/release-notes/types";
import { Button } from "@sbozh/react-ui/components/ui/button";
import { loadMoreReleases } from "@/lib/releases/actions";

interface ReleaseTimelineWithLoadMoreProps {
  initialReleases: ReleaseListItem[];
  initialSummaries: Record<string, ReactNode>;
  initialHasMore: boolean;
  currentVersion: string;
  projectSlug?: string;
}

// Compile MDX markdown to React element on the client
async function compileSummary(markdown: string): Promise<ReactNode> {
  const { default: Content } = await evaluate(markdown, {
    ...runtime,
  } as Parameters<typeof evaluate>[1]);
  return <Content />;
}

export function ReleaseTimelineWithLoadMore({
  initialReleases,
  initialSummaries,
  initialHasMore,
  currentVersion,
  projectSlug,
}: ReleaseTimelineWithLoadMoreProps) {
  const [releases, setReleases] = useState(initialReleases);
  const [summaries, setSummaries] = useState(initialSummaries);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();

  const handleLoadMore = useCallback(() => {
    startTransition(async () => {
      const result = await loadMoreReleases(releases.length, projectSlug);

      if (result.success) {
        // Compile raw markdown summaries to React elements on client
        const compiledSummaries: Record<string, ReactNode> = {};
        await Promise.all(
          Object.entries(result.rawSummaries).map(async ([id, markdown]) => {
            if (markdown) {
              compiledSummaries[id] = await compileSummary(markdown);
            } else {
              compiledSummaries[id] = null;
            }
          })
        );

        setReleases((prev) => [...prev, ...result.releases]);
        setSummaries((prev) => ({ ...prev, ...compiledSummaries }));
        setHasMore(result.hasMore);
      }
    });
  }, [releases.length, projectSlug]);

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
