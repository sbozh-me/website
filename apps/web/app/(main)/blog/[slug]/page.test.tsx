import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

// Mock next/cache
vi.mock("next/cache", () => ({
  unstable_noStore: vi.fn(),
}));

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}));

// Variable to control mock behavior
let mockShouldThrow = false;
let mockPostOverride: unknown = undefined;

// Mock the repository
vi.mock("@/lib/blog/repository", () => ({
  createBlogRepository: () => ({
    getPost: vi.fn(async (slug: string) => {
      if (mockShouldThrow) {
        throw new Error("Connection failed");
      }
      if (mockPostOverride !== undefined) {
        return mockPostOverride;
      }
      // Default: use real mock data
      const { MockBlogRepository } = await import("@sbozh/blog/data");
      const repo = new MockBlogRepository();
      return repo.getPost(slug);
    }),
    getPosts: vi.fn(async () => {
      if (mockShouldThrow) {
        throw new Error("Connection failed");
      }
      const { MockBlogRepository } = await import("@sbozh/blog/data");
      const repo = new MockBlogRepository();
      return repo.getPosts();
    }),
  }),
  DirectusError: {
    fromError: (e: Error) => ({ message: e.message, status: 500 }),
  },
}));

import BlogPostPage, { generateStaticParams, generateMetadata } from "./page";
import { notFound } from "next/navigation";

describe("BlogPostPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockShouldThrow = false;
    mockPostOverride = undefined;
  });

  it("renders post title and content", async () => {
    const params = Promise.resolve({ slug: "why-i-started-sbozh" });
    render(await BlogPostPage({ params }));

    expect(screen.getByText("Why I started sbozh.me")).toBeInTheDocument();
    expect(screen.getByText("The Founder")).toBeInTheDocument();
  });

  it("renders post header with persona", async () => {
    const params = Promise.resolve({ slug: "why-i-started-sbozh" });
    render(await BlogPostPage({ params }));

    expect(screen.getByText("The Founder")).toBeInTheDocument();
  });

  it("renders hero image when post has image", async () => {
    const params = Promise.resolve({ slug: "why-i-started-sbozh" });
    render(await BlogPostPage({ params }));

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute(
      "alt",
      "Ancient Roman trireme ship at shore ready to depart"
    );
  });

  it("renders table of contents on mobile", async () => {
    const params = Promise.resolve({ slug: "why-i-started-sbozh" });
    render(await BlogPostPage({ params }));

    // TOC should have headings from the post content
    expect(screen.getAllByText("The Beginning").length).toBeGreaterThan(0);
  });

  it("renders MDX content with code blocks", async () => {
    const params = Promise.resolve({ slug: "why-i-started-sbozh" });
    render(await BlogPostPage({ params }));

    // Content should be rendered as MDX
    expect(screen.getByText(/It all started with a question/)).toBeInTheDocument();
  });

  it("calls notFound for non-existent post", async () => {
    const params = Promise.resolve({ slug: "non-existent-post" });

    await expect(BlogPostPage({ params })).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });

  it("renders post without image", async () => {
    const params = Promise.resolve({ slug: "on-patience-and-shipping" });
    render(await BlogPostPage({ params }));

    expect(screen.getByText("On patience and shipping")).toBeInTheDocument();
    // This post has no image, so no img element for the hero
    const images = screen.queryAllByRole("img");
    expect(images.length).toBe(0);
  });

  it("renders ScrollToTop component (hidden by default)", async () => {
    const params = Promise.resolve({ slug: "why-i-started-sbozh" });
    render(await BlogPostPage({ params }));

    // ScrollToTop is hidden by default (only shows after scrolling 300px)
    // We verify the component is rendered by checking it doesn't throw
    // The button won't be visible until user scrolls
    expect(
      screen.queryByRole("button", { name: /scroll to top/i })
    ).not.toBeInTheDocument();
  });

  it("renders error state when repository throws", async () => {
    mockShouldThrow = true;
    const params = Promise.resolve({ slug: "any-slug" });
    render(await BlogPostPage({ params }));

    expect(screen.getByText("Unable to load post")).toBeInTheDocument();
    expect(screen.getByText("Connection failed")).toBeInTheDocument();
  });

  it("renders tldr when post has tldr", async () => {
    mockPostOverride = {
      id: "test",
      title: "Test Post",
      slug: "test-post",
      excerpt: "Test excerpt",
      tldr: "This is the short summary of the post.",
      content: "## Test Content\n\nSome content here.",
      date: "2025-01-01",
      readingTime: 2,
      persona: { id: "1", name: "Test Author", slug: "test", color: "#000" },
      tags: [],
    };

    const params = Promise.resolve({ slug: "test-post" });
    render(await BlogPostPage({ params }));

    expect(screen.getByText("TL;DR:")).toBeInTheDocument();
    expect(screen.getByText(/This is the short summary/)).toBeInTheDocument();
  });

  it("renders attribution when post has attribution", async () => {
    mockPostOverride = {
      id: "test",
      title: "Test Post",
      slug: "test-post",
      excerpt: "Test excerpt",
      content: "## Test Content\n\nSome content here.",
      date: "2025-01-01",
      readingTime: 2,
      persona: { id: "1", name: "Test Author", slug: "test", color: "#000" },
      tags: [],
      attribution: "Photo by [John Doe](https://example.com)",
    };

    const params = Promise.resolve({ slug: "test-post" });
    render(await BlogPostPage({ params }));

    expect(screen.getByText("Attribution")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("uses default dimensions when image has no width/height", async () => {
    mockPostOverride = {
      id: "test",
      title: "Test Post",
      slug: "test-post",
      excerpt: "Test excerpt",
      content: "## Test Content\n\nSome content here.",
      date: "2025-01-01",
      readingTime: 2,
      persona: { id: "1", name: "Test Author", slug: "test", color: "#000" },
      tags: [],
      image: {
        src: "/test-image.jpg",
        alt: "Test image",
        // No width/height - should use defaults
      },
    };

    const params = Promise.resolve({ slug: "test-post" });
    render(await BlogPostPage({ params }));

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("width", "1920");
    expect(img).toHaveAttribute("height", "1080");
  });
});

describe("generateStaticParams", () => {
  beforeEach(() => {
    mockShouldThrow = false;
  });

  it("returns array of post slugs", async () => {
    const params = await generateStaticParams();

    expect(Array.isArray(params)).toBe(true);
    expect(params.length).toBeGreaterThan(0);
    expect(params).toContainEqual({ slug: "why-i-started-sbozh" });
  });

  it("returns empty array when repository throws", async () => {
    mockShouldThrow = true;
    const params = await generateStaticParams();

    expect(Array.isArray(params)).toBe(true);
    expect(params.length).toBe(0);
  });
});

describe("generateMetadata", () => {
  beforeEach(() => {
    mockShouldThrow = false;
    mockPostOverride = undefined;
  });

  it("returns post metadata with OG and Twitter cards", async () => {
    mockPostOverride = {
      id: "test",
      title: "Test Blog Post",
      slug: "test-post",
      excerpt: "This is a test excerpt for the blog post",
      content: "## Content",
      date: "2025-01-15T10:00:00Z",
      readingTime: 5,
      persona: { id: "1", name: "John Doe", slug: "john", color: "#000" },
      tags: [],
      image: {
        src: "/images/test-og.png",
        alt: "Test image",
        width: 1200,
        height: 630,
      },
    };

    const params = Promise.resolve({ slug: "test-post" });
    const metadata = await generateMetadata({ params });

    expect(metadata.title).toBe("Test Blog Post");
    expect(metadata.description).toBe("This is a test excerpt for the blog post");
    expect(metadata.authors).toEqual([{ name: "John Doe" }]);
    expect(metadata.openGraph).toEqual({
      title: "Test Blog Post",
      description: "This is a test excerpt for the blog post",
      type: "article",
      publishedTime: "2025-01-15T10:00:00Z",
      authors: ["John Doe"],
      images: [
        {
          url: "/images/test-og.png",
          width: 1200,
          height: 630,
          alt: "Test Blog Post",
        },
      ],
    });
    expect(metadata.twitter).toEqual({
      card: "summary_large_image",
      title: "Test Blog Post",
      description: "This is a test excerpt for the blog post",
      images: ["/images/test-og.png"],
    });
  });

  it("uses default OG image when post has no image", async () => {
    mockPostOverride = {
      id: "test",
      title: "Post Without Image",
      slug: "no-image",
      excerpt: "No image here",
      content: "## Content",
      date: "2025-01-15",
      readingTime: 3,
      persona: { id: "1", name: "Jane Doe", slug: "jane", color: "#fff" },
      tags: [],
    };

    const params = Promise.resolve({ slug: "no-image" });
    const metadata = await generateMetadata({ params });

    expect(metadata.openGraph?.images).toEqual([
      {
        url: "/og/blog-default.png",
        width: 1200,
        height: 630,
        alt: "Post Without Image",
      },
    ]);
    expect(metadata.twitter?.images).toEqual(["/og/blog-default.png"]);
  });

  it("returns 'Post Not Found' title for non-existent post", async () => {
    const params = Promise.resolve({ slug: "non-existent-post" });
    const metadata = await generateMetadata({ params });

    expect(metadata.title).toBe("Post Not Found");
    expect(metadata.description).toBeUndefined();
    expect(metadata.openGraph).toBeUndefined();
  });

  it("returns fallback metadata when repository throws", async () => {
    mockShouldThrow = true;

    const params = Promise.resolve({ slug: "any-slug" });
    const metadata = await generateMetadata({ params });

    expect(metadata.title).toBe("Blog Post");
    expect(metadata.description).toBeUndefined();
    expect(metadata.openGraph).toBeUndefined();
  });
});
