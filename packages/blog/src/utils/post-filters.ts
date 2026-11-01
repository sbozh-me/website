import { formatMonth } from "./date-grouping";
import { getSeriesWithPosts } from "./series";

import type { PostFilters } from "../types/filters";
import type { Persona } from "../types/persona";
import type { PostListItem } from "../types/post";
import type { Series } from "../types/series";
import type { Tag } from "../types/tag";

export type BlogView = "cards" | "timeline" | "series";

export interface FilterOptions {
  series: Series[];
  tags: Tag[];
  personas: Persona[];
  months: { value: string; label: string }[];
}

/** Dates are stored as YYYY-MM-DD, optionally followed by a time. */
const monthOf = (post: PostListItem) => post.date.slice(0, 7);

/** Applies the filters. Expects posts sorted newest first, as the repository returns them. */
export function filterPosts(
  posts: PostListItem[],
  filters: PostFilters,
  series: Series[] = [],
): PostListItem[] {
  const seriesId = filters.series
    ? series.find((item) => item.slug === filters.series)?.id
    : undefined;
  const query = filters.query?.trim().toLowerCase();

  const matching = posts.filter(
    (post) =>
      (!filters.series || (seriesId !== undefined && post.seriesId === seriesId)) &&
      (!filters.tag || post.tags.some((tag) => tag.slug === filters.tag)) &&
      (!filters.persona || post.persona.slug === filters.persona) &&
      (!filters.month || monthOf(post) === filters.month) &&
      (!query ||
        post.title.toLowerCase().includes(query) ||
        post.excerpt.toLowerCase().includes(query)),
  );

  return filters.sort === "oldest" ? matching.reverse() : matching;
}

/** Only offers what would find something: choices come from the posts themselves. */
export function getFilterOptions(posts: PostListItem[], series: Series[] = []): FilterOptions {
  const tags = new Map(posts.flatMap((post) => post.tags).map((tag) => [tag.slug, tag]));
  const personas = new Map(posts.map((post) => [post.persona.slug, post.persona]));
  const months = [...new Set(posts.map(monthOf))].sort().reverse();

  return {
    series: getSeriesWithPosts(posts, series).map((item) => item.series),
    tags: [...tags.values()].sort((a, b) => a.name.localeCompare(b.name)),
    personas: [...personas.values()].sort((a, b) => a.name.localeCompare(b.name)),
    months: months.map((value) => ({ value, label: formatMonth(value) })),
  };
}

type SearchParams = Record<string, string | string[] | undefined>;

/** Reads filters from the URL. Anything malformed is left out rather than matching nothing. */
export function parsePostFilters(params: SearchParams): PostFilters {
  const text = (key: string) => {
    const value = params[key];
    return typeof value === "string" && value ? value : undefined;
  };
  const month = text("month");

  return {
    ...(text("series") && { series: text("series") }),
    ...(text("tag") && { tag: text("tag") }),
    ...(text("persona") && { persona: text("persona") }),
    ...(month && /^\d{4}-(0[1-9]|1[0-2])$/.test(month) && { month }),
    ...(text("q") && { query: text("q") }),
    ...(text("sort") === "oldest" && { sort: "oldest" as const }),
  };
}

/** The shareable URL of a view. Cards are the default view, so they don't need a parameter. */
export function blogHref(view: BlogView, filters: PostFilters = {}): string {
  const params = new URLSearchParams();
  if (view !== "cards") params.set("view", view);

  // The series view lists series, not posts, so post filters don't carry over to it
  if (view !== "series") {
    if (filters.series) params.set("series", filters.series);
    if (filters.tag) params.set("tag", filters.tag);
    if (filters.persona) params.set("persona", filters.persona);
    if (filters.month) params.set("month", filters.month);
    if (filters.query) params.set("q", filters.query);
    if (filters.sort === "oldest") params.set("sort", "oldest");
  }

  const search = params.toString();
  return search ? `/blog?${search}` : "/blog";
}
