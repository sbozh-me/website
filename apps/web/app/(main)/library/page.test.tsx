import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { PostListItem, PostType } from "@sbozh/blog";

let mockShouldThrow = false;
let mockPosts: PostListItem[] = [];

function fixture(id: string, slug: string, type?: PostType): PostListItem {
  return {
    id,
    slug,
    title: slug,
    excerpt: "",
    date: "2026-01-01",
    readingTime: 0,
    persona: { id: "sem", slug: "sem", name: "Sem", color: "amethyst" },
    tags: [],
    type,
  };
}

vi.mock("@/lib/blog/repository", () => ({
  createBlogRepository: () => ({
    getPosts: vi.fn(async () => {
      if (mockShouldThrow) throw new Error("Connection failed");
      return mockPosts;
    }),
  }),
  DirectusError: {
    fromError: (e: Error) => ({ message: e.message, status: 500 }),
  },
}));

import LibraryPage from "./page";

describe("Library hub", () => {
  beforeEach(() => {
    mockShouldThrow = false;
    mockPosts = [];
  });

  it("renders the four shelves with zero counts when the library is empty", async () => {
    const page = await LibraryPage();
    render(page);
    expect(screen.getByRole("heading", { name: "Library" })).toBeInTheDocument();
    for (const label of ["Laws", "Stories", "Articles", "Journal"]) {
      const heading = screen.getByRole("heading", { name: label });
      const card = heading.closest("li")!;
      expect(within(card).getByText("0 posts")).toBeInTheDocument();
    }
  });

  it("counts posts by type", async () => {
    mockPosts = [
      fixture("1", "a", "laws"),
      fixture("2", "b", "laws"),
      fixture("3", "c", "stories"),
      fixture("4", "d"), // no type → ignored
    ];
    const page = await LibraryPage();
    render(page);
    const lawsCard = screen.getByRole("heading", { name: "Laws" }).closest("li")!;
    expect(within(lawsCard).getByText("2 posts")).toBeInTheDocument();
    const storiesCard = screen.getByRole("heading", { name: "Stories" }).closest("li")!;
    expect(within(storiesCard).getByText("1 post")).toBeInTheDocument();
    const journalCard = screen.getByRole("heading", { name: "Journal" }).closest("li")!;
    expect(within(journalCard).getByText("0 posts")).toBeInTheDocument();
  });

  it("links each shelf to its /library/<type> page", async () => {
    mockPosts = [fixture("1", "a", "articles")];
    const page = await LibraryPage();
    render(page);
    expect(screen.getByRole("link", { name: /Articles/i })).toHaveAttribute(
      "href",
      "/library/articles",
    );
  });

  it("shows the error state when the repository throws", async () => {
    mockShouldThrow = true;
    const page = await LibraryPage();
    render(page);
    expect(screen.getByText("Unable to load the library")).toBeInTheDocument();
    expect(screen.getByText("Connection failed")).toBeInTheDocument();
  });
});
