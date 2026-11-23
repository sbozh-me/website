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

import LibraryAllPage, { metadata } from "./page";

const run = (search: Record<string, string> = {}) =>
  LibraryAllPage({ searchParams: Promise.resolve(search) });

describe("LibraryAllPage", () => {
  beforeEach(() => {
    mockShouldThrow = false;
    mockPosts = [];
    mockSeries = [];
    lastBrowserProps.current = null;
  });

  it("renders the title and tagline", async () => {
    render(await run());
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "All publications",
    );
    expect(screen.getByText("Every post, newest first.")).toBeInTheDocument();
  });

  it("shows the empty state when there are no posts", async () => {
    render(await run());
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
  });

  it("renders the BlogBrowser in cards view by default", async () => {
    mockPosts = [{ id: "1", slug: "a", title: "A", type: "laws" }];
    render(await run());
    const browser = screen.getByTestId("blog-browser");
    expect(browser).toHaveAttribute("data-view", "cards");
    expect(lastBrowserProps.current?.basePath).toBe("/library/all");
    expect(lastBrowserProps.current?.submitHref).toBe("/library/submit");
  });

  it("passes view=timeline through to the BlogBrowser", async () => {
    mockPosts = [{ id: "1", slug: "a", title: "A" }];
    render(await run({ view: "timeline" }));
    expect(screen.getByTestId("blog-browser")).toHaveAttribute(
      "data-view",
      "timeline",
    );
  });

  it("shows series cards when view=series and series exist", async () => {
    mockPosts = [
      { id: "1", slug: "a", title: "A", type: "laws", seriesId: "s1" },
      { id: "2", slug: "b", title: "B", type: "laws", seriesId: "s1" },
    ];
    mockSeries = [{ id: "s1", title: "Codex", slug: "codex" }];
    render(await run({ view: "series" }));
    const cards = screen.getAllByTestId("series-card");
    expect(cards).toHaveLength(1);
    expect(cards[0]).toHaveTextContent("Codex");
    expect(screen.getByTestId("view-tabs")).toHaveAttribute(
      "data-value",
      "series",
    );
    expect(screen.queryByTestId("blog-browser")).toBeNull();
  });

  it("falls back to cards when view=series but no series exist", async () => {
    mockPosts = [{ id: "1", slug: "a", title: "A" }];
    render(await run({ view: "series" }));
    expect(screen.getByTestId("blog-browser")).toHaveAttribute(
      "data-view",
      "cards",
    );
    expect(screen.queryByTestId("series-card")).toBeNull();
  });

  it("shows the error state when the repository throws", async () => {
    mockShouldThrow = true;
    render(await run());
    expect(screen.getByTestId("error-state")).toBeInTheDocument();
    expect(screen.getByText("Unable to load posts")).toBeInTheDocument();
    expect(screen.getByText("Connection failed")).toBeInTheDocument();
  });

  it("exports metadata with title, open graph and twitter cards", () => {
    expect(metadata.title).toBe("All publications | Library");
    expect(metadata.description).toBe("Every post, newest first.");
    expect(metadata.openGraph?.images).toEqual(["/ogdefault.png"]);
    expect(metadata.twitter?.card).toBe("summary_large_image");
  });
});
