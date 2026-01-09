"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import { ReleaseTimeline } from "@sbozh/release-notes/components";
import type { ReleaseListItem } from "@sbozh/release-notes/types";
import { Button } from "@sbozh/react-ui/components/ui/button";
import { loadMoreReleases } from "@/app/actions/releases";

interface ReleaseSectionProps {
  initialReleases: ReleaseListItem[];
  initialSummaries: Record<string, ReactNode>;
  initialHasMore: boolean;
}

async function compileSummary(markdown: string): Promise<ReactNode> {
  const { default: Content } = await evaluate(markdown, {
    ...runtime,
  } as any);
  return <Content />;
}

export function ReleaseSection({
  initialReleases,
  initialSummaries,
  initialHasMore,
}: ReleaseSectionProps) {
  const [releases, setReleases] = useState(initialReleases);
  const [summaries, setSummaries] = useState(initialSummaries);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);

  const loadMore = async () => {
    setIsLoading(true);
    try {
      const result = await loadMoreReleases(releases.length, 3);

      if (result.success) {
        // Compile MDX summaries on the client
        const newSummaries: Record<string, ReactNode> = {};
        await Promise.all(
          result.releases.map(async (release) => {
            if (release.summary) {
              newSummaries[release.id] = await compileSummary(release.summary);
            }
          })
        );

        setReleases((prev) => [...prev, ...result.releases]);
        setSummaries((prev) => ({ ...prev, ...newSummaries }));
        setHasMore(result.hasMore);
      } else {
        console.error("Failed to load more releases:", result.error);
      }
    } catch (error) {
      console.error("Failed to load more releases:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <ReleaseTimeline releases={releases} summaries={summaries} />
      {hasMore && (
        <div className="flex justify-center mt-8">
          <Button
            onClick={loadMore}
            disabled={isLoading}
            variant="outline"
            size="lg"
          >
            {isLoading ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
}
