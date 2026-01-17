"use server";

import type { ReleaseListItem } from "@sbozh/release-notes/types";
import { createReleaseRepository, DirectusError } from "./repository";

// Server action returns raw markdown, not ReactNode (ReactNode can't be serialized)
export interface LoadMoreReleasesResult {
  success: true;
  releases: ReleaseListItem[];
  rawSummaries: Record<string, string | null>;
  hasMore: boolean;
}

export interface LoadMoreReleasesError {
  success: false;
  error: string;
}

export type LoadMoreReleasesResponse = LoadMoreReleasesResult | LoadMoreReleasesError;

const BATCH_SIZE = 3;

export async function loadMoreReleases(offset: number, projectSlug?: string): Promise<LoadMoreReleasesResponse> {
  try {
    const repository = createReleaseRepository();
    if (!repository) {
      return { success: true, releases: [], rawSummaries: {}, hasMore: false };
    }

    // Fetch one extra to check if there are more
    const releases = await repository.getReleases({
      limit: BATCH_SIZE + 1,
      offset,
      project: projectSlug,
    });

    const hasMore = releases.length > BATCH_SIZE;
    const releasesToReturn = hasMore ? releases.slice(0, BATCH_SIZE) : releases;

    // Return raw markdown summaries (will be compiled on client)
    const rawSummaries: Record<string, string | null> = {};
    for (const release of releasesToReturn) {
      rawSummaries[release.id] = release.summary || null;
    }

    return { success: true, releases: releasesToReturn, rawSummaries, hasMore };
  } catch (error) {
    console.error("Failed to load more releases:", error);
    if (error instanceof DirectusError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Unable to load releases" };
  }
}
