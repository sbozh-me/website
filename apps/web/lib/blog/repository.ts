import {
  DirectusError,
  DirectusRepository,
  MockBlogRepository,
  type BlogRepository,
} from "@sbozh/blog/data";

import { hasTitleMarkup, plainTitle } from "./title";

export { DirectusError };

export interface CreateBlogRepositoryOptions {
  includeDrafts?: boolean;
}

export function createBlogRepository(
  options?: CreateBlogRepositoryOptions
): BlogRepository {
  const directusUrl = process.env.DIRECTUS_URL;
  const directusToken = process.env.DIRECTUS_TOKEN;

  if (directusUrl && directusToken) {
    return withPlainTitles(
      new DirectusRepository({
        url: directusUrl,
        token: directusToken,
        includeDrafts: options?.includeDrafts,
        assetBaseUrl: "/api/assets",
      })
    );
  }

  // Fallback to mock for testing/CI when Directus is not configured
  return withPlainTitles(new MockBlogRepository());
}

/**
 * Titles may carry glitch syntax (see title.ts). Everything reading `post.title` gets the
 * plain text; a single post also keeps the markup as `titleMarkup` for its page heading.
 * Series titles likewise, each keeping its markup for the headings that render it.
 */
export function withPlainTitles(repository: BlogRepository): BlogRepository {
  return {
    getPersonas: () => repository.getPersonas(),
    getAvatars: () => repository.getAvatars(),
    getTags: () => repository.getTags(),
    async getSeries() {
      const series = await repository.getSeries();
      return Promise.all(
        series.map(async (item) =>
          hasTitleMarkup(item.title)
            ? { ...item, title: await plainTitle(item.title), titleMarkup: item.title }
            : item
        )
      );
    },
    async getPosts(filters) {
      const posts = await repository.getPosts(filters);
      return Promise.all(
        posts.map(async (post) =>
          hasTitleMarkup(post.title) ? { ...post, title: await plainTitle(post.title) } : post
        )
      );
    },
    async getPost(slug) {
      const post = await repository.getPost(slug);
      if (!post || !hasTitleMarkup(post.title)) return post;
      return { ...post, title: await plainTitle(post.title), titleMarkup: post.title };
    },
  };
}
