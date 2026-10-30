import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

// Variable to control mock behavior
let mockShouldThrow = false;

// Mock the repository
vi.mock("@/lib/blog/repository", () => ({
  createBlogRepository: () => ({
    getPosts: vi.fn(async () => {
      if (mockShouldThrow) {
        throw new Error("Connection failed");
      }
      const { MockBlogRepository } = await import("@sbozh/blog/data");
      const repo = new MockBlogRepository();
      const posts = await repo.getPosts();
      // One post in a series, the other series stays empty
      return posts.map((post) =>
        post.slug === "on-patience-and-shipping" ? { ...post, seriesId: "s1" } : post
      );
    }),
    getSeries: vi.fn(async () => [
      { id: "s1", title: "Stand-up", slug: "stand-up" },
      { id: "s2", title: "Empty", slug: "empty" },
    ]),
  }),
  DirectusError: {
    fromError: (e: Error) => ({ message: e.message, status: 500 }),
  },
}));

import BlogPage from "./page";

const renderPage = async (series?: string | string[]) =>
  render(await BlogPage({ searchParams: Promise.resolve({ series }) }));

describe("BlogPage", () => {
  beforeEach(() => {
    mockShouldThrow = false;
  });

  it("renders blog heading", async () => {
    await renderPage();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Blog");
  });

  it("renders timeline with posts", async () => {
    await renderPage();
    // Should show year markers from mock data
    expect(screen.getByText("2025")).toBeInTheDocument();
    expect(screen.getByText("2024")).toBeInTheDocument();
  });

  it("renders post titles from mock data", async () => {
    await renderPage();
    expect(screen.getByText("Why I started sbozh.me")).toBeInTheDocument();
    expect(screen.getByText("On patience and shipping")).toBeInTheDocument();
  });

  it("renders error state when repository throws", async () => {
    mockShouldThrow = true;
    await renderPage();

    expect(screen.getByText("Unable to load posts")).toBeInTheDocument();
    expect(screen.getByText("Connection failed")).toBeInTheDocument();
  });

  describe("series filter", () => {
    const filter = () => within(screen.getByRole("navigation", { name: "Filter by series" }));

    it("links to series that have posts, and to all posts", async () => {
      await renderPage();

      expect(filter().getByRole("link", { name: "All posts" })).toHaveAttribute("href", "/blog");
      expect(filter().getByRole("link", { name: "Stand-up" })).toHaveAttribute(
        "href",
        "/blog?series=stand-up"
      );
      expect(filter().queryByRole("link", { name: "Empty" })).not.toBeInTheDocument();
    });

    it("shows all posts with no series selected", async () => {
      await renderPage();

      expect(filter().getByRole("link", { name: "All posts" })).toHaveAttribute(
        "aria-current",
        "page"
      );
    });

    it("shows only the selected series", async () => {
      await renderPage("stand-up");

      expect(screen.getByText("On patience and shipping")).toBeInTheDocument();
      expect(screen.queryByText("Why I started sbozh.me")).not.toBeInTheDocument();
      expect(filter().getByRole("link", { name: "Stand-up" })).toHaveAttribute(
        "aria-current",
        "page"
      );
    });

    it.each([["unknown"], ["empty"], [["stand-up", "empty"]]])(
      "falls back to all posts for %j",
      async (series) => {
        await renderPage(series);

        expect(screen.getByText("Why I started sbozh.me")).toBeInTheDocument();
        expect(filter().getByRole("link", { name: "All posts" })).toHaveAttribute(
          "aria-current",
          "page"
        );
      }
    );
  });
});
