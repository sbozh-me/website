import {
  DirectusError,
  DirectusRepository,
  MockBlogRepository,
  type BlogRepository,
} from "@sbozh/blog/data";

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
    return new DirectusRepository({
      url: directusUrl,
      token: directusToken,
      includeDrafts: options?.includeDrafts,
    });
  }

  // Fallback to mock for testing/CI when Directus is not configured
  if (process.env.NODE_ENV === "development" && !directusUrl) {
    console.warn(
      "DIRECTUS_URL not set, using MockBlogRepository. Set DIRECTUS_URL and DIRECTUS_TOKEN in .env.local"
    );
  }
  return new MockBlogRepository();
}

// Default instance for simple imports
export const blogRepository = createBlogRepository();
