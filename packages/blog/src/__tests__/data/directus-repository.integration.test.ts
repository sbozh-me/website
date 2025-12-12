import { describe, it, expect, beforeAll } from "vitest";
import { DirectusRepository, DirectusError } from "../../data/directus-repository";

/**
 * Integration tests for DirectusRepository
 *
 * These tests run against a real Directus instance.
 * Skip if DIRECTUS_URL environment variable is not set.
 *
 * To run these tests:
 * 1. Start Directus: cd apps/web/directus && docker compose up -d
 * 2. Run: DIRECTUS_URL=http://localhost:8055 DIRECTUS_TOKEN=your-token pnpm test
 */

const DIRECTUS_URL = process.env.DIRECTUS_URL;
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;
const runIntegration = !!DIRECTUS_URL;

describe.skipIf(!runIntegration)("DirectusRepository Integration", () => {
  let repository: DirectusRepository;

  beforeAll(() => {
    repository = new DirectusRepository({
      url: DIRECTUS_URL!,
      token: DIRECTUS_TOKEN,
    });
  });

  describe("connectivity", () => {
    it("connects to Directus successfully", async () => {
      // If we can fetch personas without error, we're connected
      const personas = await repository.getPersonas();
      expect(Array.isArray(personas)).toBe(true);
    });
  });

  describe("getPersonas", () => {
    it("returns personas with required fields", async () => {
      const personas = await repository.getPersonas();

      // If there are personas, verify structure
      if (personas.length > 0) {
        const persona = personas[0];
        expect(persona).toHaveProperty("id");
        expect(persona).toHaveProperty("name");
        expect(persona).toHaveProperty("slug");
        expect(persona).toHaveProperty("color");
        expect(typeof persona.id).toBe("string");
        expect(typeof persona.name).toBe("string");
        expect(typeof persona.slug).toBe("string");
        expect(typeof persona.color).toBe("string");
      }
    });
  });

  describe("getTags", () => {
    it("returns tags with required fields", async () => {
      const tags = await repository.getTags();

      if (tags.length > 0) {
        const tag = tags[0];
        expect(tag).toHaveProperty("id");
        expect(tag).toHaveProperty("name");
        expect(tag).toHaveProperty("slug");
        expect(typeof tag.id).toBe("string");
        expect(typeof tag.name).toBe("string");
        expect(typeof tag.slug).toBe("string");
      }
    });
  });

  describe("getPosts", () => {
    it("returns posts with persona relations populated", async () => {
      const posts = await repository.getPosts();

      if (posts.length > 0) {
        const post = posts[0];
        expect(post).toHaveProperty("id");
        expect(post).toHaveProperty("title");
        expect(post).toHaveProperty("slug");
        expect(post).toHaveProperty("excerpt");
        expect(post).toHaveProperty("date");
        expect(post).toHaveProperty("readingTime");
        expect(post).toHaveProperty("persona");
        expect(post).toHaveProperty("tags");

        // Verify persona is populated (not just an ID)
        expect(post.persona).toHaveProperty("name");
        expect(post.persona).toHaveProperty("slug");
        expect(post.persona).toHaveProperty("color");

        // Verify tags array structure
        expect(Array.isArray(post.tags)).toBe(true);
        if (post.tags.length > 0) {
          expect(post.tags[0]).toHaveProperty("name");
          expect(post.tags[0]).toHaveProperty("slug");
        }
      }
    });

    it("returns posts sorted by date descending", async () => {
      const posts = await repository.getPosts();

      if (posts.length >= 2) {
        const date1 = new Date(posts[0].date);
        const date2 = new Date(posts[1].date);
        expect(date1.getTime()).toBeGreaterThanOrEqual(date2.getTime());
      }
    });

    it("excludes draft posts by default", async () => {
      const posts = await repository.getPosts();

      // We can't directly verify draft exclusion without knowing the data,
      // but we can verify the posts we get back don't have status field
      // (since status isn't part of PostListItem type)
      posts.forEach((post) => {
        expect(post).not.toHaveProperty("status");
      });
    });

    it("filters by persona when provided", async () => {
      const personas = await repository.getPersonas();
      if (personas.length === 0) return;

      const personaSlug = personas[0].slug;
      const filteredPosts = await repository.getPosts({ persona: personaSlug });

      filteredPosts.forEach((post) => {
        expect(post.persona.slug).toBe(personaSlug);
      });
    });

    it("filters by tag when provided", async () => {
      const tags = await repository.getTags();
      if (tags.length === 0) return;

      const tagSlug = tags[0].slug;
      const filteredPosts = await repository.getPosts({ tag: tagSlug });

      filteredPosts.forEach((post) => {
        const hasTag = post.tags.some((t) => t.slug === tagSlug);
        expect(hasTag).toBe(true);
      });
    });

    it("filters by year when provided", async () => {
      const currentYear = new Date().getFullYear();
      const filteredPosts = await repository.getPosts({ year: currentYear });

      filteredPosts.forEach((post) => {
        const postYear = new Date(post.date).getFullYear();
        expect(postYear).toBe(currentYear);
      });
    });

    it("returns empty array for non-matching filters", async () => {
      const posts = await repository.getPosts({
        persona: "non-existent-persona-slug-12345",
      });

      expect(posts).toEqual([]);
    });
  });

  describe("getPost", () => {
    it("returns post with full content by slug", async () => {
      const posts = await repository.getPosts();
      if (posts.length === 0) return;

      const slug = posts[0].slug;
      const post = await repository.getPost(slug);

      expect(post).not.toBeNull();
      expect(post?.slug).toBe(slug);
      expect(post).toHaveProperty("content");
      expect(typeof post?.content).toBe("string");
    });

    it("returns null for non-existent slug", async () => {
      const post = await repository.getPost("non-existent-post-slug-12345");
      expect(post).toBeNull();
    });

    it("returns post with image when available", async () => {
      const posts = await repository.getPosts();
      const postWithImage = posts.find((p) => p.image);

      if (postWithImage) {
        const fullPost = await repository.getPost(postWithImage.slug);
        expect(fullPost?.image).toBeDefined();
        expect(fullPost?.image?.src).toContain(DIRECTUS_URL);
        expect(fullPost?.image).toHaveProperty("alt");
        expect(fullPost?.image).toHaveProperty("width");
        expect(fullPost?.image).toHaveProperty("height");
      }
    });
  });

  describe("includeDrafts option", () => {
    it("can fetch posts with includeDrafts enabled", async () => {
      const draftRepo = new DirectusRepository({
        url: DIRECTUS_URL!,
        token: DIRECTUS_TOKEN,
        includeDrafts: true,
      });

      // Should not throw
      const posts = await draftRepo.getPosts();
      expect(Array.isArray(posts)).toBe(true);
    });
  });

  describe("custom assetBaseUrl", () => {
    it("uses custom asset URL in image mapping", async () => {
      const customRepo = new DirectusRepository({
        url: DIRECTUS_URL!,
        token: DIRECTUS_TOKEN,
        assetBaseUrl: "/api/assets",
      });

      const posts = await customRepo.getPosts();
      const postWithImage = posts.find((p) => p.image);

      if (postWithImage) {
        expect(postWithImage.image?.src).toMatch(/^\/api\/assets\//);
      }
    });
  });

  describe("error handling", () => {
    it("throws DirectusError with bad URL", async () => {
      const badRepo = new DirectusRepository({
        url: "http://localhost:99999",
      });

      await expect(badRepo.getPersonas()).rejects.toThrow(DirectusError);
    });

    it("handles invalid token gracefully", async () => {
      const badTokenRepo = new DirectusRepository({
        url: DIRECTUS_URL!,
        token: "invalid-token-12345",
      });

      // This should either work (if public access is enabled) or throw DirectusError
      try {
        await badTokenRepo.getPersonas();
      } catch (e) {
        expect(e).toBeInstanceOf(DirectusError);
      }
    });
  });
});

// Skip notice for when tests are skipped
describe.skipIf(runIntegration)("DirectusRepository Integration (skipped)", () => {
  it("skipped - set DIRECTUS_URL environment variable to run", () => {
    console.log(
      "Integration tests skipped. To run:\n" +
        "  DIRECTUS_URL=http://localhost:8055 DIRECTUS_TOKEN=your-token pnpm test"
    );
  });
});
