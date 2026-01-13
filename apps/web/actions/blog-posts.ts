"use server";

import type { PostListItem } from "@sbozh/blog/types";
import { createBlogRepository, DirectusError } from "@/lib/blog/repository";

export type GetPostsByAuthorsResult =
  | { success: true; posts: PostListItem[] }
  | { success: false; error: string }

/**
 * Fetch blog posts by multiple persona slugs (blog authors).
 * Returns posts sorted by date, limited to the specified count.
 * If no persona slugs provided or no posts found, falls back to all posts.
 */
export async function getPostsByAuthors(
  personaSlugs: string[],
  limit = 3
): Promise<GetPostsByAuthorsResult> {
  try {
    const repository = createBlogRepository();

    let allPosts: PostListItem[] = [];

    if (personaSlugs.length > 0) {
      // Fetch posts for each persona slug in parallel
      const postPromises = personaSlugs.map((slug) =>
        repository.getPosts({ persona: slug })
      );
      const postArrays = await Promise.all(postPromises);

      // Combine all posts and remove duplicates by id
      allPosts = postArrays.flat();
    }

    // If no posts found for specific personas, fall back to all posts
    if (allPosts.length === 0) {
      allPosts = await repository.getPosts();
    }

    const uniquePosts = Array.from(
      new Map(allPosts.map((post) => [post.id, post])).values()
    );

    // Sort by date (newest first) and limit
    const sortedPosts = uniquePosts
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);

    return { success: true, posts: sortedPosts };
  } catch (error) {
    console.error("Failed to fetch posts by authors:", error);
    if (error instanceof DirectusError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Unable to load posts" };
  }
}
