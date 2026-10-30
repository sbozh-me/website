import type { PostImage } from "./post";

export interface Series {
  id: string;
  title: string;
  slug: string;
  description?: string;
  /** Hero of the series page, and its card */
  image?: PostImage;
  /** Series that continues this one */
  nextSeriesId?: string;
}
