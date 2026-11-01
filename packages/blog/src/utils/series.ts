import type { PostListItem } from "../types/post";
import type { Series } from "../types/series";

export interface SeriesWithPosts {
  series: Series;
  /** In reading order, oldest first */
  posts: PostListItem[];
}

export interface SeriesPart {
  series: Series;
  /** Position in the series, from 1 */
  part: number;
}

/**
 * Pairs each series with its posts, most recently updated series first.
 * Expects posts sorted newest first; series with nothing published are left out.
 */
export function getSeriesWithPosts(posts: PostListItem[], series: Series[]): SeriesWithPosts[] {
  return series
    .map((item) => ({
      series: item,
      posts: posts.filter((post) => post.seriesId === item.id).reverse(),
    }))
    .filter((item) => item.posts.length > 0)
    .sort((a, b) => posts.indexOf(a.posts.at(-1)!) - posts.indexOf(b.posts.at(-1)!));
}

/** Looks up which series, and which part of it, each post is. Keyed by post id. */
export function getSeriesParts(posts: PostListItem[], series: Series[]): Map<string, SeriesPart> {
  const parts = new Map<string, SeriesPart>();
  for (const { series: item, posts: list } of getSeriesWithPosts(posts, series)) {
    list.forEach((post, index) => parts.set(post.id, { series: item, part: index + 1 }));
  }
  return parts;
}
