import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

let mockShouldThrow = false;
let mockPosts: Array<{
  id: string;
  slug: string;
  title: string;
  type?: string;
  seriesId?: string;
}> = [];
let mockSeries: Array<{ id: string; title: string; slug: string }> = [];

const lastBrowserProps: { current: Record<string, unknown> | null } = { current: null };

vi.mock("@/lib/blog/repository", () => ({
  createBlogRepository: () => ({
    getPosts: vi.fn(async () => {
      if (mockShouldThrow) throw new Error("Connection failed");
      return mockPosts;
    }),
    getSeries: vi.fn(async () => mockSeries),
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

vi.mock("@sbozh/blog", async () => {
  const actual = await vi.importActual<typeof import("@sbozh/blog")>("@sbozh/blog");
  return {
    ...actual,
    BlogBrowser: (props: Record<string, unknown>) => {
      lastBrowserProps.current = props;
      return <div data-testid="blog-browser" data-view={String(props.view)} />;
    },
    BlogViewTabs: (props: Record<string, unknown>) => (
      <div
        data-testid="view-tabs"
        data-value={String(props.value)}
        data-base={String(props.basePath)}
      />
    ),
    EmptyState: () => <div data-testid="empty-state" />,
    ErrorState: (props: { title: string; message: string; status?: number }) => (
      <div data-testid="error-state">
        <span>{props.title}</span>
        <span>{props.message}</span>
      </div>
    ),
    SeriesCard: (props: { series: { id: string; title: string } }) => (
      <div data-testid="series-card">{props.series.title}</div>
    ),
  };
});

import TypePage, { generateMetadata } from "./page";

const run = (type: string, search: Record<string, string> = {}) =>
  TypePage({
    params: Promise.resolve({ type }),
    searchParams: Promise.resolve(search),
  });

describe("LibraryTypePage", () => {
  beforeEach(() => {
    mockShouldThrow = false;
    mockPosts = [];
    mockSeries = [];
    lastBrowserProps.current = null;
  });

  it("is not found for an unknown type", async () => {
    await expect(run("unknown")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it.each([
    ["laws", "Laws", "The acts and declarations of the Digital Principate."],
    ["stories", "Stories", "Stand-up chapters, love stories, rehab narratives."],
    ["articles", "Articles", "Essays with a thesis — tech, taste, and takes."],
    ["journal", "Journal", "Short status notes, milestones, loose ends."],
  ])("renders the %s heading and tagline", async (type, label, tagline) => {
    render(await run(type));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(label);
    expect(screen.getByText(tagline)).toBeInTheDocument();
  });

  it("shows the empty state when there are no posts of that type", async () => {
    mockPosts = [{ id: "1", slug: "a", title: "A", type: "stories" }];
    render(await run("laws"));
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
  });

  it("renders the BlogBrowser in cards view by default", async () => {
    mockPosts = [{ id: "1", slug: "a", title: "A", type: "laws" }];
    render(await run("laws"));
    const browser = screen.getByTestId("blog-browser");
    expect(browser).toHaveAttribute("data-view", "cards");
    expect(lastBrowserProps.current?.basePath).toBe("/library/laws");
    expect(lastBrowserProps.current?.submitHref).toBe("/library/submit");
  });

  it("passes view=timeline through to the BlogBrowser", async () => {
    mockPosts = [{ id: "1", slug: "a", title: "A", type: "laws" }];
    render(await run("laws", { view: "timeline" }));
    expect(screen.getByTestId("blog-browser")).toHaveAttribute(
      "data-view",
      "timeline",
    );
  });

  it("shows series cards when view=series and the type has series", async () => {
    mockPosts = [
      { id: "1", slug: "a", title: "A", type: "laws", seriesId: "s1" },
      { id: "2", slug: "b", title: "B", type: "laws", seriesId: "s1" },
    ];
    mockSeries = [{ id: "s1", title: "Codex", slug: "codex" }];
    render(await run("laws", { view: "series" }));
    const cards = screen.getAllByTestId("series-card");
    expect(cards).toHaveLength(1);
    expect(cards[0]).toHaveTextContent("Codex");
    expect(screen.getByTestId("view-tabs")).toHaveAttribute(
      "data-value",
      "series",
    );
    expect(screen.queryByTestId("blog-browser")).toBeNull();
  });

  it("falls back to cards when view=series but the type has no series", async () => {
    mockPosts = [{ id: "1", slug: "a", title: "A", type: "laws" }];
    render(await run("laws", { view: "series" }));
    expect(screen.getByTestId("blog-browser")).toHaveAttribute(
      "data-view",
      "cards",
    );
    expect(screen.queryByTestId("series-card")).toBeNull();
  });

  it("shows the error state when the repository throws", async () => {
    mockShouldThrow = true;
    render(await run("laws"));
    expect(screen.getByTestId("error-state")).toBeInTheDocument();
    expect(screen.getByText("Unable to load posts")).toBeInTheDocument();
    expect(screen.getByText("Connection failed")).toBeInTheDocument();
  });

  it("builds metadata for a valid type", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ type: "laws" }),
      searchParams: Promise.resolve({}),
    });
    expect(metadata.title).toBe("Laws | Library");
    expect(metadata.description).toBe(
      "The acts and declarations of the Digital Principate.",
    );
    expect(metadata.openGraph?.images).toEqual(["/ogdefault.png"]);
    expect(metadata.twitter?.card).toBe("summary_large_image");
  });

  it("falls back to a bare Library title for an unknown type", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ type: "whatever" }),
      searchParams: Promise.resolve({}),
    });
    expect(metadata).toEqual({ title: "Library" });
  });
});
