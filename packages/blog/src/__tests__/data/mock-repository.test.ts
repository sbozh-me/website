import { beforeEach, describe, expect, it } from "vitest";

import { mockPersonas, mockPosts, mockTags } from "../../data/mock-data";
import { MockBlogRepository } from "../../data/mock-repository";

describe("MockBlogRepository", () => {
  let repository: MockBlogRepository;

  beforeEach(() => {
    repository = new MockBlogRepository();
  });

  describe("getPosts", () => {
    it("returns all posts sorted by date (newest first)", async () => {
      const posts = await repository.getPosts();

      expect(posts.length).toBe(mockPosts.length);
      expect(posts[0].slug).toBe("why-i-started-sbozh");
      expect(posts[posts.length - 1].slug).toBe("building-a-design-system");
    });

    it("returns PostListItem without content field", async () => {
      const posts = await repository.getPosts();

      posts.forEach((post) => {
        expect(post).not.toHaveProperty("content");
        expect(post).toHaveProperty("id");
        expect(post).toHaveProperty("title");
        expect(post).toHaveProperty("slug");
        expect(post).toHaveProperty("excerpt");
        expect(post).toHaveProperty("date");
        expect(post).toHaveProperty("readingTime");
        expect(post).toHaveProperty("persona");
        expect(post).toHaveProperty("tags");
      });
    });

    it("filters by persona slug", async () => {
      const posts = await repository.getPosts({ persona: "founder" });

      expect(posts.length).toBe(2);
      posts.forEach((post) => {
        expect(post.persona.slug).toBe("founder");
      });
    });

    it("filters by tag slug", async () => {
      const posts = await repository.getPosts({ tag: "tech" });

      expect(posts.length).toBe(2);
      posts.forEach((post) => {
        expect(post.tags.some((t) => t.slug === "tech")).toBe(true);
      });
    });

    it("filters by year", async () => {
      const posts2025 = await repository.getPosts({ year: 2025 });
      const posts2024 = await repository.getPosts({ year: 2024 });

      expect(posts2025.length).toBe(4);
      expect(posts2024.length).toBe(1);

      posts2025.forEach((post) => {
        expect(new Date(post.date).getFullYear()).toBe(2025);
      });
    });

    it("combines multiple filters", async () => {
      const posts = await repository.getPosts({
        persona: "founder",
        year: 2025,
      });

      expect(posts.length).toBe(1);
      expect(posts[0].slug).toBe("why-i-started-sbozh");
    });

    it("returns empty array when no posts match filters", async () => {
      const posts = await repository.getPosts({ persona: "nonexistent" });

      expect(posts).toEqual([]);
    });
  });

  describe("getPost", () => {
    it("returns post by slug with content", async () => {
      const post = await repository.getPost("why-i-started-sbozh");

      expect(post).not.toBeNull();
      expect(post?.title).toBe("Why I started sbozh.me");
      expect(post?.content).toContain("## The Beginning");
      expect(post?.persona.name).toBe("The Founder");
    });

    it("returns null for non-existent slug", async () => {
      const post = await repository.getPost("non-existent-post");

      expect(post).toBeNull();
    });
  });

  describe("getPersonas", () => {
    it("returns all personas", async () => {
      const personas = await repository.getPersonas();

      expect(personas.length).toBe(mockPersonas.length);
      expect(personas[0].name).toBe("The Founder");
      expect(personas[0].color).toBe("#8b5cf6");
    });

    it("returns a copy, not the original array", async () => {
      const personas1 = await repository.getPersonas();
      const personas2 = await repository.getPersonas();

      expect(personas1).not.toBe(personas2);
      expect(personas1).toEqual(personas2);
    });
  });

  describe("getTags", () => {
    it("returns all tags", async () => {
      const tags = await repository.getTags();

      expect(tags.length).toBe(mockTags.length);
      expect(tags[0].name).toBe("Tech");
      expect(tags[0].slug).toBe("tech");
    });

    it("returns a copy, not the original array", async () => {
      const tags1 = await repository.getTags();
      const tags2 = await repository.getTags();

      expect(tags1).not.toBe(tags2);
      expect(tags1).toEqual(tags2);
    });
  });
});
