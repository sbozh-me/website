export type PostSort = "newest" | "oldest";

export interface PostFilters {
  persona?: string;
  tag?: string;
  year?: number;
  /** Series slug */
  series?: string;
  /** Publish month as YYYY-MM */
  month?: string;
  /** Free text matched against title and excerpt */
  query?: string;
  /** Newest first when left out */
  sort?: PostSort;
}
