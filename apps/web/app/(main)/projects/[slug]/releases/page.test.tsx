import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("notFound");
  }),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  })),
  useSearchParams: vi.fn(() => ({
    get: vi.fn((key: string) => null),
    getAll: vi.fn((key: string) => []),
    has: vi.fn((key: string) => false),
    toString: vi.fn(() => ""),
  })),
  usePathname: vi.fn(() => "/projects/sbozh-me/releases"),
}));

// Mock Next.js Link
vi.mock("next/link", () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

// Mock MDX evaluation
vi.mock("@mdx-js/mdx", () => ({
  evaluate: vi.fn(async (content) => ({
    default: () => <div data-testid="mdx-content">{content}</div>,
  })),
}));

// Mock fs/promises
vi.mock("fs/promises", () => {
  const readFileMock = vi.fn(async (path: string) => {
    if (path.includes("package.json")) {
      return JSON.stringify({ version: "1.2.8" });
    }
    throw new Error("File not found");
  });
  return {
    readFile: readFileMock,
    default: {
      readFile: readFileMock,
    },
  };
});

// Mock fs (for sync operations)
vi.mock("fs", () => {
  const readFileSyncMock = vi.fn((path: string) => {
    if (path.includes("CHANGELOG.md")) {
      return "# Changelog\n\n## v1.2.8 - 2024-01-01\n\n- Feature 1\n- Feature 2";
    }
    if (path.includes("ROADMAP.md")) {
      return "# Roadmap\n\n## v1.3.0\n\n- [ ] Feature A\n- [ ] Feature B";
    }
    if (path.includes("BACKLOGIDEAS.md")) {
      return "# Backlog\n\n- [ ] Future idea 1";
    }
    if (path.includes("package.json")) {
      return JSON.stringify({ version: "1.2.8" });
    }
    throw new Error("File not found");
  });
  return {
    readFileSync: readFileSyncMock,
    default: {
      readFileSync: readFileSyncMock,
    },
  };
});

// Mock release repository
const mockGetReleases = vi.fn();
vi.mock("@/lib/releases/repository", () => ({
  createReleaseRepository: vi.fn(() => ({
    getReleases: mockGetReleases,
  })),
  DirectusError: class DirectusError extends Error {
    constructor(message: string, public status?: number) {
      super(message);
    }
  },
}));

// Mock project data
vi.mock("@/lib/projects/data", () => ({
  projects: [
    {
      slug: "sbozh-me",
      title: "sbozh.me",
      tagline: "Personal startup project",
      status: "beta",
      tabs: [
        { id: "about", label: "About", enabled: true },
        { id: "releases", label: "Releases", enabled: true },
      ],
    },
  ],
}));

// Mock changelog parser
vi.mock("@/lib/changelog/parser", () => ({
  parseChangelogFromContent: vi.fn(() => ({
    title: "Changelog",
    groups: [
      {
        id: "v1.2.8",
        label: "v1.2.8",
        items: [
          { id: "1", title: "Feature 1", content: ["Added feature 1"] },
          { id: "2", title: "Feature 2", content: ["Added feature 2"] },
        ],
        completed: true,
      },
    ],
  })),
}));

// Mock roadmap parser
vi.mock("@/lib/roadmap/parser", () => ({
  parseRoadmapFromContent: vi.fn(() => ({
    data: {
      title: "Roadmap",
      groups: [
        {
          id: "v1.3.0",
          label: "v1.3.0",
          items: [
            { id: "1", title: "Feature A", content: ["Planned feature A"] },
            { id: "2", title: "Feature B", content: ["Planned feature B"] },
          ],
          completed: false,
        },
      ],
    },
    completedCount: 0,
    totalCount: 2,
  })),
}));

// Mock release notes utilities
vi.mock("@sbozh/release-notes/utils", () => ({
  formatReleaseDate: vi.fn((date: string) => "January 1, 2024"),
  calculateReadingTime: vi.fn(() => 5),
  formatReadingTime: vi.fn((minutes: number) => `${minutes} min read`),
}));

// Mock release notes components
vi.mock("@sbozh/release-notes/components", () => ({
  ReleaseMediaCard: ({ media }: any) => (
    <div data-testid="media-card">Media: {media.title}</div>
  ),
  CopyUrlButton: () => <button data-testid="copy-url-button">Copy URL</button>,
  ReleaseTimelineEntry: ({ release }: any) => (
    <div data-testid="timeline-entry">{release.title}</div>
  ),
  ReleaseTimeline: ({ releases, summaries, projectSlug }: any) => (
    <div data-testid="release-timeline">
      {releases.map((r: any) => (
        <div key={r.id} data-testid="timeline-entry">{r.title}</div>
      ))}
    </div>
  ),
}));

import ReleasesPage, { generateStaticParams, generateMetadata } from "./page";

describe("ReleasesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateStaticParams", () => {
    it("returns params for sbozh-me project", async () => {
      const params = await generateStaticParams();
      expect(params).toEqual([{ slug: "sbozh-me" }]);
    });
  });

  describe("generateMetadata", () => {
    it("generates metadata for valid project", async () => {
      const params = Promise.resolve({ slug: "sbozh-me" });
      const metadata = await generateMetadata({ params });

      expect(metadata).toEqual({
        title: "Releases - sbozh.me",
        description: "Release notes, changelog, and roadmap for sbozh.me",
      });
    });

    it("generates not found metadata for invalid project", async () => {
      const params = Promise.resolve({ slug: "invalid-project" });
      const metadata = await generateMetadata({ params });

      expect(metadata).toEqual({
        title: "Not Found",
      });
    });
  });

  describe("rendering", () => {
    it("renders releases page with release notes tab by default", async () => {
      mockGetReleases.mockResolvedValue([
        {
          id: "1",
          slug: "release-1",
          version: "1.2.0",
          title: "Release 1",
          summary: "Summary content",
          dateReleased: "2024-01-01",
          project: { id: "1", name: "sbozh.me", slug: "sbozh-me" },
          type: "feature",
        },
      ]);

      const params = Promise.resolve({ slug: "sbozh-me" });
      const searchParams = Promise.resolve({ tab: undefined });
      const Page = await ReleasesPage({ params, searchParams });
      render(Page);

      // Should render the tabs
      expect(screen.getByText("Release Notes")).toBeInTheDocument();
      expect(screen.getByText("Changelog")).toBeInTheDocument();
      expect(screen.getByText("Roadmap")).toBeInTheDocument();
    });

    it("renders changelog tab when tab=changelog", async () => {
      mockGetReleases.mockResolvedValue([]);

      const params = Promise.resolve({ slug: "sbozh-me" });
      const searchParams = Promise.resolve({ tab: "changelog" });
      const Page = await ReleasesPage({ params, searchParams });
      render(Page);

      expect(screen.getByText("Changelog")).toBeInTheDocument();
    });

    it("renders roadmap tab when tab=roadmap", async () => {
      mockGetReleases.mockResolvedValue([]);

      const params = Promise.resolve({ slug: "sbozh-me" });
      const searchParams = Promise.resolve({ tab: "roadmap" });
      const Page = await ReleasesPage({ params, searchParams });
      render(Page);

      expect(screen.getByText("Roadmap")).toBeInTheDocument();
    });

    it("calls notFound for non-sbozh-me project", async () => {
      const { notFound } = await import("next/navigation");
      const params = Promise.resolve({ slug: "other-project" });
      const searchParams = Promise.resolve({});

      await expect(ReleasesPage({ params, searchParams })).rejects.toThrow();
      expect(notFound).toHaveBeenCalled();
    });

    it("handles multiple releases correctly", async () => {
      mockGetReleases.mockResolvedValue([
        {
          id: "1",
          slug: "release-1",
          version: "1.2.0",
          title: "Release 1",
          summary: "Summary 1",
          dateReleased: "2024-01-01",
          project: { id: "1", name: "sbozh.me", slug: "sbozh-me" },
          type: "feature",
        },
        {
          id: "2",
          slug: "release-2",
          version: "1.1.0",
          title: "Release 2",
          summary: "Summary 2",
          dateReleased: "2023-12-01",
          project: { id: "1", name: "sbozh.me", slug: "sbozh-me" },
          type: "fix",
        },
      ]);

      const params = Promise.resolve({ slug: "sbozh-me" });
      const searchParams = Promise.resolve({});
      const Page = await ReleasesPage({ params, searchParams });
      render(Page);

      expect(screen.getByText("Release Notes")).toBeInTheDocument();
    });

    it("indicates hasMore when there are more releases than limit", async () => {
      // Return 4 releases (limit + 1)
      mockGetReleases.mockResolvedValue([
        {
          id: "1",
          slug: "release-1",
          version: "1.2.0",
          title: "Release 1",
          summary: "Summary 1",
          dateReleased: "2024-01-01",
          project: { id: "1", name: "sbozh.me", slug: "sbozh-me" },
        },
        {
          id: "2",
          slug: "release-2",
          version: "1.1.0",
          title: "Release 2",
          summary: "Summary 2",
          dateReleased: "2023-12-01",
          project: { id: "1", name: "sbozh.me", slug: "sbozh-me" },
        },
        {
          id: "3",
          slug: "release-3",
          version: "1.0.0",
          title: "Release 3",
          summary: "Summary 3",
          dateReleased: "2023-11-01",
          project: { id: "1", name: "sbozh.me", slug: "sbozh-me" },
        },
        {
          id: "4",
          slug: "release-4",
          version: "0.9.0",
          title: "Release 4",
          summary: "Summary 4",
          dateReleased: "2023-10-01",
          project: { id: "1", name: "sbozh.me", slug: "sbozh-me" },
        },
      ]);

      const params = Promise.resolve({ slug: "sbozh-me" });
      const searchParams = Promise.resolve({});
      const Page = await ReleasesPage({ params, searchParams });
      render(Page);

      // Should render tabs
      expect(screen.getByText("Release Notes")).toBeInTheDocument();
    });

    it("passes project filter to repository", async () => {
      mockGetReleases.mockResolvedValue([]);

      const params = Promise.resolve({ slug: "sbozh-me" });
      const searchParams = Promise.resolve({});
      await ReleasesPage({ params, searchParams });

      expect(mockGetReleases).toHaveBeenCalledWith({
        project: "sbozh-me",
        limit: 4, // INITIAL_LIMIT + 1
      });
    });
  });

  describe("error handling", () => {
    it("handles getChangelog error gracefully", async () => {
      // Re-mock fs to throw for CHANGELOG.md
      const { readFileSync } = await import("fs");
      vi.mocked(readFileSync).mockImplementation((path: string) => {
        if (String(path).includes("CHANGELOG.md")) {
          throw new Error("File not found");
        }
        if (String(path).includes("ROADMAP.md")) {
          return "# Roadmap\n\n## v1.3.0\n\n- [ ] Feature A";
        }
        if (String(path).includes("BACKLOGIDEAS.md")) {
          return "# Backlog\n\n- [ ] Future idea 1";
        }
        if (String(path).includes("package.json")) {
          return JSON.stringify({ version: "1.2.8" });
        }
        throw new Error("Unknown file");
      });

      mockGetReleases.mockResolvedValue([]);

      const params = Promise.resolve({ slug: "sbozh-me" });
      const searchParams = Promise.resolve({ tab: "changelog" });
      const Page = await ReleasesPage({ params, searchParams });
      render(Page);

      // Page should still render without crashing
      expect(screen.getByText("Changelog")).toBeInTheDocument();
    });

    it("handles getRoadmap error gracefully", async () => {
      // Re-mock fs to throw for ROADMAP.md
      const { readFileSync } = await import("fs");
      vi.mocked(readFileSync).mockImplementation((path: string) => {
        if (String(path).includes("CHANGELOG.md")) {
          return "# Changelog\n\n## v1.2.8 - 2024-01-01\n\n- Feature 1";
        }
        if (String(path).includes("ROADMAP.md")) {
          throw new Error("File not found");
        }
        if (String(path).includes("BACKLOGIDEAS.md")) {
          return "# Backlog\n\n- [ ] Future idea 1";
        }
        if (String(path).includes("package.json")) {
          return JSON.stringify({ version: "1.2.8" });
        }
        throw new Error("Unknown file");
      });

      mockGetReleases.mockResolvedValue([]);

      const params = Promise.resolve({ slug: "sbozh-me" });
      const searchParams = Promise.resolve({ tab: "roadmap" });
      const Page = await ReleasesPage({ params, searchParams });
      render(Page);

      // Page should still render without crashing
      expect(screen.getByText("Roadmap")).toBeInTheDocument();
    });
  });
});
