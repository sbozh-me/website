import type { PostListItem } from "../types/post";

export interface AdjacentPosts {
  /** The post published just before the current one (older) */
  previous: PostListItem | null;
  /** The post published just after the current one (newer) */
  next: PostListItem | null;
}

/**
 * Finds the neighbours of a post.
 * Expects posts sorted newest first, as the repository returns them.
 *
 * A series is a closed list: its posts only neighbour each other, and posts
 * outside any series skip over them.
 *
 * An editor-picked `nextPostId` overrides the chronological next post, and the
 * picked post links back to the one that chose it as its previous post.
 * Picks pointing at the post itself, at an unpublished post or across a series
 * boundary are ignored.
 */
export function getAdjacentPosts(
  posts: PostListItem[],
  slug: string
): AdjacentPosts {
  const current = posts.find((post) => post.slug === slug);
  if (!current) {
    return { previous: null, next: null };
  }

  const list = posts.filter((post) => post.seriesId === current.seriesId);
  const index = list.indexOf(current);
  const pickedNext = current.nextPostId
    ? list.find((post) => post.id === current.nextPostId && post.id !== current.id)
    : undefined;
  const pickedPrevious = list.find(
    (post) => post.nextPostId === current.id && post.id !== current.id
  );

  return {
    previous: pickedPrevious ?? list[index + 1] ?? null,
    next: pickedNext ?? list[index - 1] ?? null,
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
