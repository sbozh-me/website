import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock error state component
vi.mock("@sbozh/release-notes/components", () => ({
  ErrorState: ({ message, status }: any) => (
    <div data-testid="error-state">
      Error: {message} {status && `(Status: ${status})`}
    </div>
  ),
}));

// Mock timeline with load more component
vi.mock("./ReleaseTimelineWithLoadMore", () => ({
  ReleaseTimelineWithLoadMore: ({
    initialReleases,
    initialSummaries,
    initialHasMore,
    currentVersion,
    projectSlug,
  }: any) => (
    <div data-testid="timeline-with-load-more">
      Releases: {initialReleases.length}, Has More: {String(initialHasMore)},
      Version: {currentVersion}, Project: {projectSlug}
    </div>
  ),
}));

import { ReleaseNotesTab } from "./ReleaseNotesTab";

describe("ReleaseNotesTab", () => {
  const mockRelease = {
    id: "1",
    slug: "release-1",
    version: "1.0.0",
    title: "Release 1",
    summary: "Test summary",
    dateReleased: "2024-01-01",
    project: { id: "1", name: "Test", slug: "test" },
  };

  describe("error state", () => {
    it("renders error state when data.success is false", () => {
      const data = {
        success: false as const,
        error: "Failed to fetch releases",
      };

      render(<ReleaseNotesTab data={data} projectSlug="test-project" />);

      expect(screen.getByTestId("error-state")).toBeInTheDocument();
      expect(screen.getByText(/Failed to fetch releases/)).toBeInTheDocument();
    });

    it("renders error state with status code", () => {
      const data = {
        success: false as const,
        error: "Service unavailable",
        status: 503,
      };

      render(<ReleaseNotesTab data={data} projectSlug="test-project" />);

      expect(screen.getByTestId("error-state")).toBeInTheDocument();
      expect(screen.getByText(/Service unavailable/)).toBeInTheDocument();
      expect(screen.getByText(/503/)).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("renders empty state when there are no releases", () => {
      const data = {
        success: true as const,
        releases: [],
        summaries: {},
        hasMore: false,
        currentVersion: "1.0.0",
      };

      render(<ReleaseNotesTab data={data} projectSlug="test-project" />);

      expect(screen.getByText("No release notes available yet.")).toBeInTheDocument();
    });

    it("does not render timeline when there are no releases", () => {
      const data = {
        success: true as const,
        releases: [],
        summaries: {},
        hasMore: false,
        currentVersion: "1.0.0",
      };

      render(<ReleaseNotesTab data={data} projectSlug="test-project" />);

      expect(screen.queryByTestId("timeline-with-load-more")).not.toBeInTheDocument();
    });
  });

  describe("success state with releases", () => {
    it("renders timeline with releases", () => {
      const data = {
        success: true as const,
        releases: [mockRelease],
        summaries: { "1": <div>Summary</div> },
        hasMore: false,
        currentVersion: "1.0.0",
      };

      render(<ReleaseNotesTab data={data} projectSlug="test-project" />);

      expect(screen.getByTestId("timeline-with-load-more")).toBeInTheDocument();
    });

    it("passes correct props to timeline component", () => {
      const data = {
        success: true as const,
        releases: [mockRelease, { ...mockRelease, id: "2" }],
        summaries: { "1": <div>Summary 1</div>, "2": <div>Summary 2</div> },
        hasMore: true,
        currentVersion: "2.0.0",
      };

      render(<ReleaseNotesTab data={data} projectSlug="my-project" />);

      const timeline = screen.getByTestId("timeline-with-load-more");
      expect(timeline).toHaveTextContent("Releases: 2");
      expect(timeline).toHaveTextContent("Has More: true");
      expect(timeline).toHaveTextContent("Version: 2.0.0");
      expect(timeline).toHaveTextContent("Project: my-project");
    });

    it("passes hasMore=false when no more releases", () => {
      const data = {
        success: true as const,
        releases: [mockRelease],
        summaries: {},
        hasMore: false,
        currentVersion: "1.0.0",
      };

      render(<ReleaseNotesTab data={data} projectSlug="test" />);

      expect(screen.getByTestId("timeline-with-load-more")).toHaveTextContent("Has More: false");
    });
  });
});
