import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("notFound");
  }),
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

// Mock release repository
vi.mock("@/lib/releases/repository", () => ({
  createReleaseRepository: vi.fn(() => ({
    getReleaseBySlug: vi.fn(),
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
      name: "sbozh.me",
      tagline: "Personal startup project",
      status: "beta",
    },
  ],
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
}));

import ReleaseDetailPage, { generateStaticParams, generateMetadata } from "./page";
import { createReleaseRepository, DirectusError } from "@/lib/releases/repository";

const mockCreateReleaseRepository = vi.mocked(createReleaseRepository);
const mockGetReleaseBySlug = vi.fn();

describe("ReleaseDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default implementation
    mockCreateReleaseRepository.mockReturnValue({
      getReleaseBySlug: mockGetReleaseBySlug,
    });
  });

  describe("generateStaticParams", () => {
    it("returns empty array for on-demand generation", async () => {
      const params = await generateStaticParams();
      expect(params).toEqual([]);
    });
  });

  describe("generateMetadata", () => {
    it("generates metadata for valid release", async () => {
      mockGetReleaseBySlug.mockResolvedValue({
        id: "1",
        slug: "release-1",
        version: "1.2.0",
        title: "Release 1",
        summary: "This is a summary of the release. It contains important information about the changes.",
        dateReleased: "2024-01-01",
        project: { id: "1", name: "sbozh.me", slug: "sbozh-me" },
        type: "feature",
      });

      const params = Promise.resolve({ slug: "sbozh-me", releaseSlug: "release-1" });
      const metadata = await generateMetadata({ params });

      expect(metadata).toEqual({
        title: "Release 1 - sbozh.me",
        description: "This is a summary of the release. It contains important information about the changes.",
      });
    });

    it("generates not found metadata for invalid project", async () => {
      const params = Promise.resolve({ slug: "invalid-project", releaseSlug: "release-1" });
      const metadata = await generateMetadata({ params });

      expect(metadata).toEqual({
        title: "Not Found",
      });
    });

    it("generates not found metadata for invalid release", async () => {
      mockGetReleaseBySlug.mockResolvedValue(null);

      const params = Promise.resolve({ slug: "sbozh-me", releaseSlug: "invalid-release" });
      const metadata = await generateMetadata({ params });

      expect(metadata).toEqual({
        title: "Release Not Found",
      });
    });

    it("truncates description to 160 characters", async () => {
      const longSummary = "A".repeat(200);
      mockGetReleaseBySlug.mockResolvedValue({
        id: "1",
        slug: "release-1",
        version: "1.2.0",
        title: "Release 1",
        summary: longSummary,
        dateReleased: "2024-01-01",
        project: { id: "1", name: "sbozh.me", slug: "sbozh-me" },
      });

      const params = Promise.resolve({ slug: "sbozh-me", releaseSlug: "release-1" });
      const metadata = await generateMetadata({ params });

      expect(metadata.description).toHaveLength(160);
    });
  });

  describe("rendering", () => {
    it("renders release detail page with all elements", async () => {
      mockGetReleaseBySlug.mockResolvedValue({
        id: "1",
        slug: "release-1",
        version: "1.2.0",
        title: "Release 1",
        summary: "Summary content",
        dateReleased: "2024-01-01",
        project: { id: "1", name: "sbozh.me", slug: "sbozh-me" },
        type: "feature",
      });

      const params = Promise.resolve({ slug: "sbozh-me", releaseSlug: "release-1" });
      const Page = await ReleaseDetailPage({ params });
      render(Page);

      // Check main elements
      expect(screen.getByText("Release 1")).toBeInTheDocument();
      expect(screen.getByText("1.2.0")).toBeInTheDocument();
      expect(screen.getByText("Feature")).toBeInTheDocument();
      expect(screen.getByText("January 1, 2024")).toBeInTheDocument();
      expect(screen.getByText("5 min read")).toBeInTheDocument();
      expect(screen.getByTestId("copy-url-button")).toBeInTheDocument();
      expect(screen.getByTestId("mdx-content")).toBeInTheDocument();
    });

    it("renders back link to releases page", async () => {
      mockGetReleaseBySlug.mockResolvedValue({
        id: "1",
        slug: "release-1",
        version: "1.2.0",
        title: "Release 1",
        summary: "Summary content",
        dateReleased: "2024-01-01",
        project: { id: "1", name: "sbozh.me", slug: "sbozh-me" },
      });

      const params = Promise.resolve({ slug: "sbozh-me", releaseSlug: "release-1" });
      const Page = await ReleaseDetailPage({ params });
      const { container } = render(Page);

      const backLink = container.querySelector('a[href="/projects/sbozh-me/releases"]');
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveTextContent("Releases");
    });

    it("renders media card when media is present", async () => {
      mockGetReleaseBySlug.mockResolvedValue({
        id: "1",
        slug: "release-1",
        version: "1.2.0",
        title: "Release 1",
        summary: "Summary content",
        dateReleased: "2024-01-01",
        project: { id: "1", name: "sbozh.me", slug: "sbozh-me" },
        media: {
          id: "media-1",
          title: "Screenshot",
          filename_download: "screenshot.png",
          type: "image/png",
          width: 1920,
          height: 1080,
        },
      });

      const params = Promise.resolve({ slug: "sbozh-me", releaseSlug: "release-1" });
      const Page = await ReleaseDetailPage({ params });
      render(Page);

      expect(screen.getByTestId("media-card")).toBeInTheDocument();
      expect(screen.getByText("Media: Screenshot")).toBeInTheDocument();
    });

    it("does not render media card when media is absent", async () => {
      mockGetReleaseBySlug.mockResolvedValue({
        id: "1",
        slug: "release-1",
        version: "1.2.0",
        title: "Release 1",
        summary: "Summary content",
        dateReleased: "2024-01-01",
        project: { id: "1", name: "sbozh.me", slug: "sbozh-me" },
        media: undefined,
      });

      const params = Promise.resolve({ slug: "sbozh-me", releaseSlug: "release-1" });
      const Page = await ReleaseDetailPage({ params });
      render(Page);

      expect(screen.queryByTestId("media-card")).not.toBeInTheDocument();
    });

    it("renders different release types with correct styling", async () => {
      const releaseTypes = ["feature", "fix", "breaking", "maintenance"] as const;

      for (const type of releaseTypes) {
        vi.clearAllMocks();
        mockGetReleaseBySlug.mockResolvedValue({
          id: "1",
          slug: "release-1",
          version: "1.2.0",
          title: "Release 1",
          summary: "Summary content",
          dateReleased: "2024-01-01",
          project: { id: "1", name: "sbozh.me", slug: "sbozh-me" },
          type,
        });

        const params = Promise.resolve({ slug: "sbozh-me", releaseSlug: "release-1" });
        const Page = await ReleaseDetailPage({ params });
        const { unmount } = render(Page);

        // Check that the type label is rendered
        const typeLabels = {
          feature: "Feature",
          fix: "Fix",
          breaking: "Breaking",
          maintenance: "Maintenance",
        };
        expect(screen.getByText(typeLabels[type])).toBeInTheDocument();

        unmount();
      }
    });

    it("calls notFound for non-sbozh-me project", async () => {
      const { notFound } = await import("next/navigation");
      const params = Promise.resolve({ slug: "other-project", releaseSlug: "release-1" });

      await expect(ReleaseDetailPage({ params })).rejects.toThrow();
      expect(notFound).toHaveBeenCalled();
    });

    it("calls notFound when release is not found", async () => {
      mockGetReleaseBySlug.mockResolvedValue(null);
      const { notFound } = await import("next/navigation");
      const params = Promise.resolve({ slug: "sbozh-me", releaseSlug: "invalid-release" });

      await expect(ReleaseDetailPage({ params })).rejects.toThrow();
      expect(notFound).toHaveBeenCalled();
    });

    it("calls notFound when repository returns null", async () => {
      mockGetReleaseBySlug.mockResolvedValue(null);
      const { notFound } = await import("next/navigation");
      const params = Promise.resolve({ slug: "sbozh-me", releaseSlug: "release-1" });

      await expect(ReleaseDetailPage({ params })).rejects.toThrow();
      expect(notFound).toHaveBeenCalled();
    });

    it("handles release without version", async () => {
      mockGetReleaseBySlug.mockResolvedValue({
        id: "1",
        slug: "release-1",
        version: undefined,
        title: "Release 1",
        summary: "Summary content",
        dateReleased: "2024-01-01",
        project: { id: "1", name: "sbozh.me", slug: "sbozh-me" },
      });

      const params = Promise.resolve({ slug: "sbozh-me", releaseSlug: "release-1" });
      const Page = await ReleaseDetailPage({ params });
      render(Page);

      expect(screen.getByText("Release 1")).toBeInTheDocument();
      // Version badge should not be rendered
      expect(screen.queryByText("1.2.0")).not.toBeInTheDocument();
    });

    it("handles release without type", async () => {
      mockGetReleaseBySlug.mockResolvedValue({
        id: "1",
        slug: "release-1",
        version: "1.2.0",
        title: "Release 1",
        summary: "Summary content",
        dateReleased: "2024-01-01",
        project: { id: "1", name: "sbozh.me", slug: "sbozh-me" },
        type: undefined,
      });

      const params = Promise.resolve({ slug: "sbozh-me", releaseSlug: "release-1" });
      const Page = await ReleaseDetailPage({ params });
      render(Page);

      expect(screen.getByText("Release 1")).toBeInTheDocument();
      // Type badges should not be rendered
      expect(screen.queryByText("Feature")).not.toBeInTheDocument();
      expect(screen.queryByText("Fix")).not.toBeInTheDocument();
    });

    it("applies correct prose styling to content", async () => {
      mockGetReleaseBySlug.mockResolvedValue({
        id: "1",
        slug: "release-1",
        version: "1.2.0",
        title: "Release 1",
        summary: "Summary content",
        dateReleased: "2024-01-01",
        project: { id: "1", name: "sbozh.me", slug: "sbozh-me" },
      });

      const params = Promise.resolve({ slug: "sbozh-me", releaseSlug: "release-1" });
      const Page = await ReleaseDetailPage({ params });
      const { container } = render(Page);

      const article = container.querySelector("article");
      expect(article).toHaveClass("prose", "prose-sm", "prose-muted", "max-w-none");
    });
  });

  describe("error handling", () => {
    it("calls notFound when repository is null", async () => {
      mockCreateReleaseRepository.mockReturnValue(null as any);
      const { notFound } = await import("next/navigation");
      const params = Promise.resolve({ slug: "sbozh-me", releaseSlug: "release-1" });

      await expect(ReleaseDetailPage({ params })).rejects.toThrow();
      expect(notFound).toHaveBeenCalled();
    });

    it("calls notFound when repository throws DirectusError", async () => {
      mockGetReleaseBySlug.mockRejectedValue(new DirectusError("API Error", 500));
      const { notFound } = await import("next/navigation");
      const params = Promise.resolve({ slug: "sbozh-me", releaseSlug: "release-1" });

      await expect(ReleaseDetailPage({ params })).rejects.toThrow();
      expect(notFound).toHaveBeenCalled();
    });

    it("calls notFound when repository throws generic error", async () => {
      mockGetReleaseBySlug.mockRejectedValue(new Error("Network error"));
      const { notFound } = await import("next/navigation");
      const params = Promise.resolve({ slug: "sbozh-me", releaseSlug: "release-1" });

      await expect(ReleaseDetailPage({ params })).rejects.toThrow();
      expect(notFound).toHaveBeenCalled();
    });
  });
});
