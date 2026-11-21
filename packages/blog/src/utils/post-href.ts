import type { PostListItem } from "../types/post";

/**
 * URL of a single post. Posts live under their type (`/library/<type>/<slug>`);
 * a post without a type falls back to the slug-only shortcut at `/blog/<slug>`
 * which server-redirects to the right place.
 */
export function postHref(post: Pick<PostListItem, "slug" | "type">): string {
  return post.type ? `/library/${post.type}/${post.slug}` : `/blog/${post.slug}`;
}

/** URL of a series page. */
export function seriesHref(slug: string): string {
  return `/library/series/${slug}`;
}
