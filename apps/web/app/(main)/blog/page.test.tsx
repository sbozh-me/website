import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

// Variables to control mock behavior
let mockShouldThrow = false;
let mockSeries: { id: string; title: string; slug: string }[] = [];

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
      return posts.map((post) =>
        post.slug === "on-patience-and-shipping" ? { ...post, seriesId: "s1" } : post
      );
    }),
    getSeries: vi.fn(async () => mockSeries),
  }),
  DirectusError: {
    fromError: (e: Error) => ({ message: e.message, status: 500 }),
  },
}));

import BlogPage from "./page";

const renderPage = async (view?: string | string[], params: Record<string, string> = {}) =>
  render(await BlogPage({ searchParams: Promise.resolve({ view, ...params }) }));

const standUp = { id: "s1", title: "Stand-up", slug: "stand-up" };
const empty = { id: "s2", title: "Empty", slug: "empty" };

describe("BlogPage", () => {
  beforeEach(() => {
    mockShouldThrow = false;
    mockSeries = [];
  });

  it("renders blog heading", async () => {
    await renderPage();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Blog");
  });

  it("opens on the card view", async () => {
    await renderPage();

    const tabs = within(screen.getByRole("navigation", { name: "Blog view" }));
    expect(tabs.getByRole("link", { name: "Cards" })).toHaveAttribute("aria-current", "page");
    expect(screen.queryByText("2025")).not.toBeInTheDocument();
  });

  it("renders timeline with posts when asked for", async () => {
    await renderPage("timeline");
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

  describe("views", () => {
    const tabs = () => within(screen.getByRole("navigation", { name: "Blog view" }));

    it("hides the series view until a series has published posts", async () => {
      mockSeries = [empty];
      await renderPage("series");

      expect(tabs().queryByRole("link", { name: "Series" })).not.toBeInTheDocument();
      expect(screen.getByText("Why I started sbozh.me")).toBeInTheDocument();
    });

    it("labels series posts", async () => {
      mockSeries = [standUp];
      await renderPage();

      expect(screen.getByText("Why I started sbozh.me")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Stand-up · Post 1" })).toHaveAttribute(
        "href",
        "/blog/series/stand-up"
      );
    });

    it("shows series cards in the series view", async () => {
      mockSeries = [standUp, empty];
      await renderPage("series");

      expect(tabs().getByRole("link", { name: "Series" })).toHaveAttribute("aria-current", "page");
      expect(screen.getByRole("heading", { name: "Stand-up" }).closest("a")).toHaveAttribute(
        "href",
        "/blog/series/stand-up"
      );
      expect(screen.queryByText("Empty")).not.toBeInTheDocument();
      expect(screen.queryByText("Why I started sbozh.me")).not.toBeInTheDocument();
    });

    it.each([["unknown"], [["series", "posts"]]])("falls back to cards for %j", async (view) => {
      mockSeries = [standUp];
      await renderPage(view);

      expect(tabs().getByRole("link", { name: "Cards" })).toHaveAttribute("aria-current", "page");
      expect(screen.getByText("Why I started sbozh.me")).toBeInTheDocument();
    });

    it("applies filters from the URL", async () => {
      await renderPage(undefined, { q: "patience" });

      expect(screen.getByText("On patience and shipping")).toBeInTheDocument();
      expect(screen.queryByText("Why I started sbozh.me")).not.toBeInTheDocument();
      expect(screen.getByRole("searchbox", { name: "Search posts" })).toHaveValue("patience");
    });

    it("keeps filters when switching view", async () => {
      await renderPage(undefined, { q: "patience" });

      expect(tabs().getByRole("link", { name: "Timeline" })).toHaveAttribute(
        "href",
        "/blog?view=timeline&q=patience"
      );
    });
  });
});
