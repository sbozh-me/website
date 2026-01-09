"use client";

import { useState, type ReactNode } from "react";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import type { ReleaseListItem } from "../types/release";
import { ReleaseTimelineEntry } from "./ReleaseTimelineEntry";
import { Button } from "@sbozh/react-ui/components/ui/button";

interface ReleaseTimelineWithLoadMoreProps {
  initialReleases: ReleaseListItem[];
  initialSummaries: Record<string, ReactNode>;
  apiEndpoint?: string;
}

async function compileSummary(markdown: string): Promise<ReactNode> {
  const { default: Content } = await evaluate(markdown, {
    ...runtime,
  } as any);
  return <Content />;
}

export function ReleaseTimelineWithLoadMore({
  initialReleases,
  initialSummaries,
  apiEndpoint = "/api/releases",
}: ReleaseTimelineWithLoadMoreProps) {
  const [releases, setReleases] = useState(initialReleases);
  const [summaries, setSummaries] = useState(initialSummaries);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMore = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${apiEndpoint}?offset=${releases.length}&limit=3`
      );

      if (!response.ok) {
        throw new Error("Failed to load more releases");
      }

      const data = await response.json();

      if (data.releases.length === 0) {
        setHasMore(false);
        return;
      }

      const newReleases: ReleaseListItem[] = data.releases;

      // Compile MDX summaries in parallel
      const summaryEntries = await Promise.all(
        newReleases.map(async (release) => {
          if (!release.summary) return [release.id, null] as const;
          const content = await compileSummary(release.summary);
          return [release.id, content] as const;
        })
      );
      const newSummaries = Object.fromEntries(summaryEntries);

      setReleases((prev) => [...prev, ...newReleases]);
      setSummaries((prev) => ({ ...prev, ...newSummaries }));
      setHasMore(data.hasMore);
    } catch (err) {
      console.error("Error loading more releases:", err);
      setError("Failed to load more releases. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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
        <div className="mt-8 flex justify-center">
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

      {error && (
        <div className="mt-4 text-center text-sm text-red-500">{error}</div>
      )}
    </section>
  );
}
