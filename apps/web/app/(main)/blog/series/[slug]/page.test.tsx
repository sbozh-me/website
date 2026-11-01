import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

let mockShouldThrow = false;

const makePost = (slug: string, seriesId?: string) => ({
  id: slug,
  title: slug,
  slug,
  excerpt: "",
  date: "2026-01-01",
  readingTime: 1,
  persona: { id: "1", name: "P", slug: "p", color: "#fff" },
  tags: [],
  seriesId,
});

const hero = { src: "/api/assets/hero", alt: "hero.png", width: 1600, height: 900 };

vi.mock("@/lib/blog/repository", () => ({
  createBlogRepository: () => ({
    getPosts: vi.fn(async () => {
      if (mockShouldThrow) {
        throw new Error("Connection failed");
      }
      return [
        makePost("two-a", "part-2"),
        makePost("article"),
        makePost("one-b", "part-1"),
        makePost("one-a", "part-1"),
      ];
    }),
    getSeries: vi.fn(async () => [
      {
        id: "part-1",
        title: "Part 1",
        slug: "part-1",
        description: "The first run",
        image: hero,
        nextSeriesId: "part-2",
      },
      { id: "part-2", title: "Part 2", slug: "part-2" },
      { id: "draft", title: "Draft", slug: "draft" },
    ]),
  }),
  DirectusError: {
    fromError: (e: Error) => ({ message: e.message, status: 500 }),
  },
}));

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

import SeriesPage, { generateMetadata } from "./page";

const params = (slug: string) => ({ params: Promise.resolve({ slug }) });

describe("SeriesPage", () => {
  beforeEach(() => {
    mockShouldThrow = false;
  });

  it("shows the Hero image, title and description", async () => {
    render(await SeriesPage(params("part-1")));

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Part 1");
    expect(screen.getByText("The first run")).toBeInTheDocument();
    expect(screen.getByAltText("hero.png")).toBeInTheDocument();
  });

  it("lists only its posts in reading order", async () => {
    render(await SeriesPage(params("part-1")));

    const titles = screen.getAllByRole("listitem").map((item) => item.querySelector("h4")?.textContent);
    expect(titles).toEqual(["one-a", "one-b"]);
  });

  it("links to the next series, and back", async () => {
    render(await SeriesPage(params("part-1")));
    expect(screen.getByRole("link", { name: /Next series: Part 2/ })).toHaveAttribute(
      "href",
      "/blog/series/part-2"
    );

    render(await SeriesPage(params("part-2")));
    expect(screen.getByRole("link", { name: /Previous series: Part 1/ })).toHaveAttribute(
      "href",
      "/blog/series/part-1"
    );
  });

  it.each(["unknown", "draft"])("is not found for %s", async (slug) => {
    await expect(SeriesPage(params(slug))).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("shows an error state when the repository throws", async () => {
    mockShouldThrow = true;
    render(await SeriesPage(params("part-1")));

    expect(screen.getByText("Unable to load series")).toBeInTheDocument();
  });

  it("builds metadata from the series", async () => {
    const metadata = await generateMetadata(params("part-1"));

    expect(metadata.title).toBe("Part 1");
    expect(metadata.description).toBe("The first run");
    expect(metadata.openGraph?.images).toEqual([
      expect.objectContaining({ url: "/api/assets/hero" }),
    ]);
  });
});
