import type { SeriesPromotion } from "@sbozh/blog/types";
import { getSeriesWithPosts, type SeriesWithPosts } from "@sbozh/blog/utils";

import { createBlogRepository } from "./repository";

/** Main page promo slots, each filled by a series with its posts */
export type PromotedSeries = Partial<Record<SeriesPromotion, SeriesWithPosts>>;

/**
 * Series promoted on the main page, by their Directus `series.promotion` slot.
 * When two share a slot, the most recently updated wins. Series with nothing
 * published stay hidden, like everywhere else. Empty when none, or Directus is down.
 */
export async function getPromotedSeries(): Promise<PromotedSeries> {
  try {
    const repository = createBlogRepository();
    const promoted = (await repository.getSeries()).filter((series) => series.promotion);
    if (promoted.length === 0) return {};

    const posts = await repository.getPosts();
    const slots: PromotedSeries = {};
    // Most recently updated first, so the first one into a slot keeps it
    for (const item of getSeriesWithPosts(posts, promoted)) {
      slots[item.series.promotion!] ??= item;
    }
    return slots;
  } catch (error) {
    console.error("Failed to fetch the promoted series:", error);
    return {};
  }
}
