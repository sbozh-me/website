import type { PostListItem } from "../types/post";
import type { Series } from "../types/series";

export interface AdjacentPosts {
  /** The post published just before the current one (older) */
  previous: PostListItem | null;
  /** The post published just after the current one (newer) */
  next: PostListItem | null;
  /** `previous` is the last post of the series this one continues */
  previousIsSeries?: boolean;
  /** `next` is the first post of the series continuing this one */
  nextIsSeries?: boolean;
}

/**
 * Finds the neighbours of a post.
 * Expects posts sorted newest first, as the repository returns them.
 *
 * A series is a closed list: its posts only neighbour each other, and posts
 * outside any series skip over them. The one way out is a linked series: the
 * last post of a series leads to the first post of its `nextSeriesId`, and back.
 *
 * An editor-picked `nextPostId` overrides the chronological next post, and the
 * picked post links back to the one that chose it as its previous post.
 * Picks pointing at the post itself, at an unpublished post or across a series
 * boundary are ignored. So are picks pointing at an older post: every other step
 * moves forward in time, so a backward pick would send readers round in a circle
 * and cut them off from everything newer.
 */
export function getAdjacentPosts(
  posts: PostListItem[],
  slug: string,
  series: Series[] = []
): AdjacentPosts {
  const current = posts.find((post) => post.slug === slug);
  if (!current) {
    return { previous: null, next: null };
  }

  const list = posts.filter((post) => post.seriesId === current.seriesId);
  const index = list.indexOf(current);
  // Newest first: picks may only come from older posts and lead to newer ones.
  // When several posts pick this one, the closest of them is its previous post.
  const pickedNext = current.nextPostId
    ? list.slice(0, index).find((post) => post.id === current.nextPostId)
    : undefined;
  const pickedPrevious = list.slice(index + 1).find((post) => post.nextPostId === current.id);

  const previous = pickedPrevious ?? list[index + 1] ?? null;
  const next = pickedNext ?? list[index - 1] ?? null;
  const inSeries = (id?: string) => posts.filter((post) => id && post.seriesId === id);

  const currentSeries = series.find((item) => item.id === current.seriesId);
  const earlierSeries = currentSeries && series.find((item) => item.nextSeriesId === currentSeries.id);
  const lastOfEarlier =
    !previous && earlierSeries && earlierSeries.id !== currentSeries?.id
      ? inSeries(earlierSeries.id)[0]
      : undefined;
  const firstOfLater =
    !next && currentSeries?.nextSeriesId !== currentSeries?.id
      ? inSeries(currentSeries?.nextSeriesId).at(-1)
      : undefined;

  return {
    previous: previous ?? lastOfEarlier ?? null,
    next: next ?? firstOfLater ?? null,
    ...(lastOfEarlier && { previousIsSeries: true }),
    ...(firstOfLater && { nextIsSeries: true }),
  };
}

/**
 * Asks the asset proxy for a downscaled copy of a Directus image.
 * Other sources are returned untouched.
 */
export function thumbnailSrc(src: string, width: 320 | 640 | 960): string {
  if (!src.startsWith("/api/assets/")) {
    return src;
  }
  return `${src}?w=${width}`;
}
