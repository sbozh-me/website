import { describe, expect, it, vi, beforeEach } from "vitest";

let mockPost:
  | { slug: string; type?: string | null }
  | null
  | ((slug: string) => unknown) = null;
let mockShouldThrow = false;

vi.mock("@/lib/blog/repository", () => ({
  createBlogRepository: () => ({
    getPost: vi.fn(async (slug: string) => {
      if (mockShouldThrow) throw new Error("Connection failed");
      if (typeof mockPost === "function") return mockPost(slug);
      return mockPost;
    }),
  }),
}));

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
  redirect: (destination: string) => {
    throw new Error(`NEXT_REDIRECT:${destination}`);
  },
}));

import BlogSlugRedirect from "./page";

const run = (slug: string) =>
  BlogSlugRedirect({ params: Promise.resolve({ slug }) });

describe("BlogSlugRedirect", () => {
  beforeEach(() => {
    mockPost = null;
    mockShouldThrow = false;
  });

  it("redirects a known post to its canonical /library URL", async () => {
    mockPost = { slug: "hello-world", type: "articles" };
    await expect(run("hello-world")).rejects.toThrow(
      "NEXT_REDIRECT:/library/articles/hello-world",
    );
  });

  it("is not found when the repository throws", async () => {
    mockShouldThrow = true;
    await expect(run("anything")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("is not found when the post has no type", async () => {
    mockPost = { slug: "typeless", type: null };
    await expect(run("typeless")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("is not found when the repository returns null", async () => {
    mockPost = null;
    await expect(run("missing")).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
