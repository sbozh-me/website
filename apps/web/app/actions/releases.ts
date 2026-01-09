"use server";

import { marked } from "marked";
import type { ReleaseListItem } from "@sbozh/release-notes/types";
import { createReleaseRepository, DirectusError } from "@/lib/releases/repository";

const RELEASES_PER_PAGE = 3;

export interface LoadMoreResult {
  success: true;
  releases: ReleaseListItem[];
  htmlSummaries: Record<string, string>;
  hasMore: boolean;
}

export interface LoadMoreError {
  success: false;
  error: string;
}

export type LoadMoreResponse = LoadMoreResult | LoadMoreError;

export async function loadMoreReleases(
  offset: number,
  limit: number = RELEASES_PER_PAGE
): Promise<LoadMoreResponse> {
  try {
    const repository = createReleaseRepository();
    if (!repository) {
      return { success: true, releases: [], htmlSummaries: {}, hasMore: false };
    }

    const releases = await repository.getReleases({ offset, limit });

    // Convert markdown summaries to HTML strings in parallel
    const summaryEntries = await Promise.all(
      releases.map(async (release) => {
        if (!release.summary) return [release.id, ""] as const;
        const html = await marked.parse(release.summary);
        return [release.id, html] as const;
      })
    );
    const htmlSummaries = Object.fromEntries(summaryEntries);

    return {
      success: true,
      releases,
      htmlSummaries,
      hasMore: releases.length === limit,
    };
  } catch (error) {
    console.error("Failed to load more releases:", error);
    if (error instanceof DirectusError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to load releases" };
  }
}
