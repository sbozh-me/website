import type { PostListItem } from "../types/post";

export interface AdjacentPosts {
  /** The post published just before the current one (older) */
  previous: PostListItem | null;
  /** The post published just after the current one (newer) */
  next: PostListItem | null;
}

/**
 * Finds the chronological neighbours of a post.
 * Expects posts sorted newest first, as the repository returns them.
 */
export function getAdjacentPosts(
  posts: PostListItem[],
  slug: string
): AdjacentPosts {
  const index = posts.findIndex((post) => post.slug === slug);
  if (index === -1) {
    return { previous: null, next: null };
  }

  return {
    previous: posts[index + 1] ?? null,
    next: posts[index - 1] ?? null,
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
