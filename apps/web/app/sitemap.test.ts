import { describe, expect, it, vi } from "vitest";

// Mock the repository
vi.mock("@/lib/blog/repository", () => ({
  createBlogRepository: () => ({
    getPosts: vi.fn(async () => [
      { slug: "test-post-1", date: "2024-01-15" },
      { slug: "test-post-2", date: "2024-02-20" },
    ]),
  }),
}));

import sitemap from "./sitemap";

describe("sitemap.ts", () => {
  it("includes static routes", async () => {
    const result = await sitemap();
    const urls = result.map((entry) => entry.url);

    expect(urls).toContain("https://sbozh.me");
    expect(urls).toContain("https://sbozh.me/blog");
    expect(urls).toContain("https://sbozh.me/projects");
  });

  it("excludes /cv route", async () => {
    const result = await sitemap();
    const urls = result.map((entry) => entry.url);

    expect(urls).not.toContain("https://sbozh.me/cv");
  });

  it("includes blog post routes", async () => {
    const result = await sitemap();
    const urls = result.map((entry) => entry.url);

    expect(urls).toContain("https://sbozh.me/blog/test-post-1");
    expect(urls).toContain("https://sbozh.me/blog/test-post-2");
  });

  it("includes project tab routes", async () => {
    const result = await sitemap();
    const urls = result.map((entry) => entry.url);

    // About tab is at /projects/[slug], not /projects/[slug]/about
    expect(urls).toContain("https://sbozh.me/projects/sbozh-me");
    expect(urls).toContain("https://sbozh.me/projects/discord-community");

    // Other tabs are at /projects/[slug]/[tab]
    expect(urls).toContain("https://sbozh.me/projects/sbozh-me/roadmap");
    expect(urls).toContain("https://sbozh.me/projects/discord-community/roadmap");
  });

  it("sets correct lastModified for blog posts", async () => {
    const result = await sitemap();
    const post1 = result.find((entry) =>
      entry.url.includes("blog/test-post-1")
    );

    expect(post1?.lastModified).toEqual(new Date("2024-01-15"));
  });

  it("sets correct priorities", async () => {
    const result = await sitemap();

    const homepage = result.find((entry) => entry.url === "https://sbozh.me");
    const blog = result.find((entry) => entry.url === "https://sbozh.me/blog");
    const projects = result.find(
      (entry) => entry.url === "https://sbozh.me/projects"
    );
    const blogPost = result.find((entry) =>
      entry.url.includes("blog/test-post")
    );

    expect(homepage?.priority).toBe(1);
    expect(blog?.priority).toBe(0.8);
    expect(projects?.priority).toBe(0.8);
    expect(blogPost?.priority).toBe(0.6);
  });

  it("sets correct changeFrequency values", async () => {
    const result = await sitemap();

    const homepage = result.find((entry) => entry.url === "https://sbozh.me");
    const blog = result.find((entry) => entry.url === "https://sbozh.me/blog");
    const blogPost = result.find((entry) =>
      entry.url.includes("blog/test-post")
    );

    expect(homepage?.changeFrequency).toBe("monthly");
    expect(blog?.changeFrequency).toBe("weekly");
    expect(blogPost?.changeFrequency).toBe("monthly");
  });
});

describe("sitemap.ts error handling", () => {
  it("returns static routes when repository fails", async () => {
    // Re-mock with error
    vi.doMock("@/lib/blog/repository", () => ({
      createBlogRepository: () => ({
        getPosts: vi.fn(async () => {
          throw new Error("Connection failed");
        }),
      }),
    }));

    // Need to re-import after mock change
    vi.resetModules();
    const { default: sitemapWithError } = await import("./sitemap");
    const result = await sitemapWithError();
    const urls = result.map((entry) => entry.url);

    // Static routes should still be present
    expect(urls).toContain("https://sbozh.me");
    expect(urls).toContain("https://sbozh.me/blog");
    expect(urls).toContain("https://sbozh.me/projects");
  });
});
