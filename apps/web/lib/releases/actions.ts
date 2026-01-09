"use server";

import type { ReleaseListItem } from "@sbozh/release-notes/types";
import { createReleaseRepository, DirectusError } from "./repository";

export type LoadMoreReleasesResult =
  | { success: true; releases: ReleaseListItem[]; hasMore: boolean }
  | { success: false; error: string };

const PAGE_SIZE = 3;

export async function loadMoreReleases(
  offset: number
): Promise<LoadMoreReleasesResult> {
  try {
    const repository = createReleaseRepository();
    if (!repository) {
      return { success: true, releases: [], hasMore: false };
    }

    // Fetch one extra to check if there are more
    const releases = await repository.getReleases({
      limit: PAGE_SIZE + 1,
      offset,
    });

    const hasMore = releases.length > PAGE_SIZE;
    const releasesToReturn = hasMore ? releases.slice(0, PAGE_SIZE) : releases;

    return { success: true, releases: releasesToReturn, hasMore };
  } catch (error) {
    console.error("Failed to load more releases:", error);
    if (error instanceof DirectusError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Unable to load more releases" };
  }
}
