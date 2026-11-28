import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { readFile } from "fs/promises";
import { createReleaseRepository, DirectusError } from "@/lib/releases/repository";

// Mock Next.js Link
vi.mock("next/link", () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

// Mock fs/promises
vi.mock("fs/promises", () => ({
  readFile: vi.fn(async () => JSON.stringify({ version: "1.0.0" })),
  default: { readFile: vi.fn(async () => JSON.stringify({ version: "1.0.0" })) },
}));

// Mock MDX evaluation
vi.mock("@mdx-js/mdx", () => ({
  evaluate: vi.fn(async (content) => ({
    default: () => <div data-testid="mdx-content">{content}</div>,
  })),
}));

// Mock release repository
vi.mock("@/lib/releases/repository", () => ({
  createReleaseRepository: vi.fn(() => ({
    getReleases: vi.fn(async () => []),
  })),
  DirectusError: class DirectusError extends Error {
    status?: number;
    constructor(message: string, status?: number) {
      super(message);
      this.status = status;
    }
  },
}));

// Mock release-notes components
vi.mock("@sbozh/release-notes/components", () => ({
  ReleaseTimeline: () => <div data-testid="release-timeline">Release Timeline</div>,
  ReleaseTimelineEntry: () => <div>Release Entry</div>,
  ReleaseMediaCard: () => <div>Media Card</div>,
  CopyUrlButton: () => <button>Copy URL</button>,
  ErrorState: ({ message, status }: any) => (
    <div data-testid="error-state">Error: {message} {status && `(${status})`}</div>
  ),
}));

// Mock ReleaseTimelineWithLoadMore
vi.mock("@/components/releases/ReleaseTimelineWithLoadMore", () => ({
  ReleaseTimelineWithLoadMore: ({ initialReleases }: any) => (
    <div data-testid="timeline">Timeline ({initialReleases.length} releases)</div>
  ),
}));

// Mock HomeContent component
vi.mock("@/components/home", () => ({
  HomeVideoHero: ({ script }: any) => (
    <section data-testid="home-video-hero" data-script={script ? script.name : "none"} />
  ),
  HomeContent: () => (
    <div data-testid="home-content">
      <h1>Sem Bozhyk</h1>
      <p>Software Developer</p>
    </div>
  ),
  HomePoster: ({ alt }: any) => <img data-testid="home-poster" alt={alt} />,
  SeriesPromo: ({ big }: any) => (big ? <aside data-testid="series-promo">{big.series.title}</aside> : null),
}));

// Mock the promoted series
vi.mock("@/lib/blog/promoted-series", () => ({
  getPromotedSeries: vi.fn(async () => ({})),
}));

// Mock avatars from Directus
vi.mock("@/lib/avatars", () => ({
  getAvatars: vi.fn(async () => [
    {
      id: "a1",
      name: "Sem Bozhyk",
      slug: "sem-bozhyk",
      personas: [
        { id: "p1", name: "The Founder", slug: "founder", color: "#8b5cf6" },
        { id: "p2", name: "The Architect", slug: "architect", color: "#22c55e" },
      ],
    },
  ]),
  toAuthor: (avatar: { slug: string; name: string; personas: { slug: string }[] }) => ({
    id: avatar.slug,
    name: avatar.name,
    blogAuthorSlugs: avatar.personas.map((p) => p.slug),
  }),
}));

// Kagurame's script, prepared on the server
vi.mock("@/lib/kagurame/script", () => ({
  loadKagurameScript: vi.fn(async () => ({ name: "Kagurame" })),
}));

// Mock blog posts action
vi.mock("@/actions/blog-posts", () => ({
  getPostsByAuthors: vi.fn(async () => ({ success: true, posts: [] })),
}));

import Home, { dynamic } from "./page";
import { getAvatars } from "@/lib/avatars";
import { getPostsByAuthors } from "@/actions/blog-posts";
import { getPromotedSeries } from "@/lib/blog/promoted-series";
import { loadKagurameScript } from "@/lib/kagurame/script";

const mockReadFile = vi.mocked(readFile);
const mockCreateRepository = vi.mocked(createReleaseRepository);

describe("Home", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders per request, never from a build-time prerender", () => {
    // A build without DIRECTUS_* would otherwise bake in no releases and mock posts
    expect(dynamic).toBe("force-dynamic");
  });

  describe("basic rendering", () => {
    it("renders home content", async () => {
      const Page = await Home();
      render(Page);
      expect(screen.getByTestId("home-content")).toBeInTheDocument();
    });

    it("opens with the video hero, before the main content", async () => {
      render(await Home());
      const hero = screen.getByTestId("home-video-hero");
      expect(hero).toBeInTheDocument();
      expect(hero.closest("main")).toBeNull();
    });

    it("hands Kagurame the latest post", async () => {
      vi.mocked(getPostsByAuthors).mockResolvedValueOnce({
        success: true,
        posts: [{ title: "Gladiators", slug: "gladiators", readingTime: 7 } as any],
      });
      render(await Home());
      expect(loadKagurameScript).toHaveBeenCalledWith({
        title: "Gladiators",
        slug: "gladiators",
        readingTime: 7,
      });
      expect(screen.getByTestId("home-video-hero")).toHaveAttribute("data-script", "Kagurame");
    });

    it("passes no post when there is none, and no script when it is broken", async () => {
      vi.mocked(loadKagurameScript).mockResolvedValueOnce(null);
      render(await Home());
      expect(loadKagurameScript).toHaveBeenCalledWith(undefined);
      expect(screen.getByTestId("home-video-hero")).toHaveAttribute("data-script", "none");
    });

    it("renders author name", async () => {
      const Page = await Home();
      render(Page);
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Sem Bozhyk",
      );
    });

    it("loads the first avatar's posts through its personas", async () => {
      await Home();
      expect(getPostsByAuthors).toHaveBeenCalledWith(["founder", "architect"], 3);
    });

    it("falls back to the latest posts when there are no avatars", async () => {
      vi.mocked(getAvatars).mockResolvedValueOnce([]);
      render(await Home());
      expect(getPostsByAuthors).toHaveBeenCalledWith([], 3);
      expect(screen.getByTestId("home-content")).toBeInTheDocument();
    });

    it("renders author title", async () => {
      const Page = await Home();
      render(Page);
      expect(screen.getByText(/Software Developer/)).toBeInTheDocument();
    });
  });

  describe("series promotion", () => {
    it("shows nothing when no series is promoted", async () => {
      render(await Home());
      expect(screen.queryByTestId("series-promo")).not.toBeInTheDocument();
    });

    it("shows the promoted series above the avatar hero", async () => {
      vi.mocked(getPromotedSeries).mockResolvedValueOnce({
        big: { series: { id: "s1", title: "Pan Dude Stand-up", slug: "pan-dude", promotion: "big" }, posts: [] },
      });
      render(await Home());

      const promo = screen.getByTestId("series-promo");
      expect(promo).toHaveTextContent("Pan Dude Stand-up");
      expect(
        promo.compareDocumentPosition(screen.getByTestId("home-content")) &
          Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
    });
  });

  describe("release notes section", () => {
    it("does not show release notes when no releases", async () => {
      const Page = await Home();
      render(Page);
      expect(screen.queryByTestId("timeline")).not.toBeInTheDocument();
    });

    it("shows release notes timeline when releases exist", async () => {
      mockCreateRepository.mockReturnValue({
        getReleases: vi.fn(async () => [
          { id: "1", slug: "r1", title: "Release 1", summary: "Test summary", dateReleased: "2024-01-01" },
        ]),
      });
      const Page = await Home();
      render(Page);
      expect(screen.getByTestId("timeline")).toBeInTheDocument();
      expect(screen.getByText("Release Notes")).toBeInTheDocument();
    });

    it("lists every release it fetched", async () => {
      mockCreateRepository.mockReturnValue({
        getReleases: vi.fn(async () => [
          { id: "1", slug: "r1", title: "Release 1", summary: "# Summary content", dateReleased: "2024-01-01" },
          { id: "2", slug: "r2", title: "Release 2", summary: "More content", dateReleased: "2024-01-02" },
        ]),
      });
      const Page = await Home();
      render(Page);
      expect(screen.getByTestId("timeline")).toHaveTextContent("2 releases");
    });

    it("lists a release that has no summary", async () => {
      mockCreateRepository.mockReturnValue({
        getReleases: vi.fn(async () => [
          { id: "1", slug: "r1", title: "Release 1", summary: undefined, dateReleased: "2024-01-01" },
        ]),
      });
      const Page = await Home();
      render(Page);
      expect(screen.getByTestId("timeline")).toBeInTheDocument();
    });

    it("shows hasMore when more releases exist", async () => {
      // Return 4 releases (INITIAL_LIMIT + 1)
      mockCreateRepository.mockReturnValue({
        getReleases: vi.fn(async () => [
          { id: "1", slug: "r1", title: "Release 1", summary: "s1", dateReleased: "2024-01-01" },
          { id: "2", slug: "r2", title: "Release 2", summary: "s2", dateReleased: "2024-01-02" },
          { id: "3", slug: "r3", title: "Release 3", summary: "s3", dateReleased: "2024-01-03" },
          { id: "4", slug: "r4", title: "Release 4", summary: "s4", dateReleased: "2024-01-04" },
        ]),
      });
      const Page = await Home();
      render(Page);
      // Should only show 3 (INITIAL_LIMIT)
      expect(screen.getByTestId("timeline")).toHaveTextContent("3 releases");
    });
  });

  describe("error handling", () => {
    it("shows error state when repository returns null", async () => {
      mockCreateRepository.mockReturnValue(null);
      const Page = await Home();
      render(Page);
      // When repository is null, it returns empty releases (not an error)
      expect(screen.queryByTestId("error-state")).not.toBeInTheDocument();
    });

    it("shows error state on DirectusError", async () => {
      mockCreateRepository.mockReturnValue({
        getReleases: vi.fn(async () => {
          throw new DirectusError("API error", 500);
        }),
      });
      const Page = await Home();
      render(Page);
      expect(screen.getByTestId("error-state")).toBeInTheDocument();
      expect(screen.getByText(/API error/)).toBeInTheDocument();
      expect(screen.getByText(/500/)).toBeInTheDocument();
    });

    it("shows generic error on unknown error", async () => {
      mockCreateRepository.mockReturnValue({
        getReleases: vi.fn(async () => {
          throw new Error("Unknown error");
        }),
      });
      const Page = await Home();
      render(Page);
      expect(screen.getByTestId("error-state")).toBeInTheDocument();
      expect(screen.getByText(/Unable to load releases/)).toBeInTheDocument();
    });
  });

  describe("version fetching", () => {
    it("handles package.json read failure gracefully", async () => {
      mockReadFile.mockRejectedValue(new Error("File not found"));
      mockCreateRepository.mockReturnValue({
        getReleases: vi.fn(async () => [
          { id: "1", slug: "r1", title: "Release 1", summary: "s1", dateReleased: "2024-01-01" },
        ]),
      });
      const Page = await Home();
      render(Page);
      // Should still render, using default version
      expect(screen.getByTestId("timeline")).toBeInTheDocument();
    });
  });
});
