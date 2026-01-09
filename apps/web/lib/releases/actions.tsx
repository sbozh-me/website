"use server";

import type { ReactNode } from "react";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import type { ReleaseListItem } from "@sbozh/release-notes/types";
import { createReleaseRepository, DirectusError } from "./repository";

export interface LoadMoreReleasesResult {
  success: true;
  releases: ReleaseListItem[];
  summaries: Record<string, ReactNode>;
  hasMore: boolean;
}

export interface LoadMoreReleasesError {
  success: false;
  error: string;
}

export type LoadMoreReleasesResponse = LoadMoreReleasesResult | LoadMoreReleasesError;

const BATCH_SIZE = 3;

async function compileSummary(markdown: string): Promise<ReactNode> {
  const { default: Content } = await evaluate(markdown, {
    ...runtime,
  } as any);
  return <Content />;
}

export async function loadMoreReleases(offset: number): Promise<LoadMoreReleasesResponse> {
  try {
    const repository = createReleaseRepository();
    if (!repository) {
      return { success: true, releases: [], summaries: {}, hasMore: false };
    }

    // Fetch one extra to check if there are more
    const releases = await repository.getReleases({
      limit: BATCH_SIZE + 1,
      offset,
    });

    const hasMore = releases.length > BATCH_SIZE;
    const releasesToReturn = hasMore ? releases.slice(0, BATCH_SIZE) : releases;

    // Compile MDX summaries in parallel
    const summaryEntries = await Promise.all(
      releasesToReturn.map(async (release) => {
        if (!release.summary) return [release.id, null] as const;
        const content = await compileSummary(release.summary);
        return [release.id, content] as const;
      })
    );
    const summaries = Object.fromEntries(summaryEntries);

    return { success: true, releases: releasesToReturn, summaries, hasMore };
  } catch (error) {
    console.error("Failed to load more releases:", error);
    if (error instanceof DirectusError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Unable to load releases" };
  }
}
