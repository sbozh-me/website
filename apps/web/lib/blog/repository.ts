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
      assetBaseUrl: "/api/assets",
    });
  }

  // Fallback to mock for testing/CI when Directus is not configured
  return new MockBlogRepository();
}
