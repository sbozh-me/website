"use server";

import { createReleaseRepository, DirectusError } from "@/lib/releases/repository";

export async function loadMoreReleases(offset: number, limit: number = 3) {
  try {
    const repository = createReleaseRepository();
    if (!repository) {
      return {
        success: false as const,
        error: "Release repository not configured",
      };
    }

    // Fetch all releases and slice for pagination
    const allReleases = await repository.getReleases({});
    const releases = allReleases.slice(offset, offset + limit);
    const hasMore = offset + limit < allReleases.length;

    return {
      success: true as const,
      releases,
      hasMore,
    };
  } catch (error) {
    console.error("Failed to load more releases:", error);
    if (error instanceof DirectusError) {
      return {
        success: false as const,
        error: error.message,
      };
    }
    return {
      success: false as const,
      error: "Unable to load releases",
    };
  }
}
