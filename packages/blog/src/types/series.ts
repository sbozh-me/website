import type { PostImage } from "./post";

export const SERIES_STATUSES = ["planned", "ongoing", "finished"] as const;

/** Where a series is in its life: announced, still getting parts, or complete */
export type SeriesStatus = (typeof SERIES_STATUSES)[number];

export const SERIES_PROMOTIONS = ["big", "left", "right"] as const;

/** Main page promo slot: big on top, left and right under it */
export type SeriesPromotion = (typeof SERIES_PROMOTIONS)[number];

export interface Series {
  id: string;
  /** Plain text: the tab title, cards, the label on a post */
  title: string;
  /** The title as written, with inline syntax for headings (when it has any) */
  titleMarkup?: string;
  slug: string;
  description?: string;
  /** Hero of the series page, and its card */
  image?: PostImage;
  /** Series that continues this one */
  nextSeriesId?: string;
  /** No badge when unset */
  status?: SeriesStatus;
  /** Off the main page when unset */
  promotion?: SeriesPromotion;
}
