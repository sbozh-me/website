import { describe, expect, it, vi } from "vitest";

// Mock the blog repository
vi.mock("@/lib/blog/repository", () => ({
  createBlogRepository: () => ({
    getPosts: vi.fn(async () => [
      { slug: "test-post-1", date: "2024-01-15" },
      { slug: "test-post-2", date: "2024-02-20" },
    ]),
  }),
}));

// Mock the release repository
vi.mock("@/lib/releases/repository", () => ({
  createReleaseRepository: () => ({
    getReleases: vi.fn(async () => [
      {
        slug: "v1-3-0",
        dateReleased: "2025-01-10",
        project: { slug: "sbozh-me", name: "sbozh.me" },
      },
      {
        slug: "v1-2-0",
        dateReleased: "2025-01-05",
        project: { slug: "sbozh-me", name: "sbozh.me" },
      },
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
    // sbozh-me has releases tab (not roadmap)
    expect(urls).toContain("https://sbozh.me/projects/sbozh-me/releases");
    // discord-community has roadmap tab
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

  it("includes release detail routes", async () => {
    const result = await sitemap();
    const urls = result.map((entry) => entry.url);

    expect(urls).toContain("https://sbozh.me/projects/sbozh-me/releases/v1-3-0");
    expect(urls).toContain("https://sbozh.me/projects/sbozh-me/releases/v1-2-0");
  });

  it("sets correct lastModified for releases", async () => {
    const result = await sitemap();
    const release = result.find((entry) =>
      entry.url.includes("releases/v1-3-0")
    );

    expect(release?.lastModified).toEqual(new Date("2025-01-10"));
  });

  it("sets correct priority for releases", async () => {
    const result = await sitemap();
    const release = result.find((entry) =>
      entry.url.includes("releases/v1-3-0")
    );

    expect(release?.priority).toBe(0.5);
  });

  it("uses latest release date for releases tab", async () => {
    const result = await sitemap();
    const releasesTab = result.find(
      (entry) => entry.url === "https://sbozh.me/projects/sbozh-me/releases"
    );

    // Should use the latest release date (2025-01-10) not static data
    expect(releasesTab?.lastModified).toEqual(new Date("2025-01-10"));
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
