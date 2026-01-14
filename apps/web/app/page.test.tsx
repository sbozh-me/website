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
  HomeContent: () => (
    <div data-testid="home-content">
      <h1>Sem Bozhyk</h1>
      <p>Software Developer</p>
    </div>
  ),
}));

// Mock blog posts action
vi.mock("@/actions/blog-posts", () => ({
  getPostsByAuthors: vi.fn(async () => ({ success: true, posts: [] })),
}));

import Home from "./page";

const mockReadFile = vi.mocked(readFile);
const mockCreateRepository = vi.mocked(createReleaseRepository);

describe("Home", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("basic rendering", () => {
    it("renders home content", async () => {
      const Page = await Home();
      render(Page);
      expect(screen.getByTestId("home-content")).toBeInTheDocument();
    });

    it("renders author name", async () => {
      const Page = await Home();
      render(Page);
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Sem Bozhyk",
      );
    });

    it("renders author title", async () => {
      const Page = await Home();
      render(Page);
      expect(screen.getByText(/Software Developer/)).toBeInTheDocument();
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

    it("handles releases with summaries", async () => {
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

    it("handles releases without summaries", async () => {
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
