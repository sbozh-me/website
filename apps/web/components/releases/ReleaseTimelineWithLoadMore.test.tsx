import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock release timeline component
vi.mock("@sbozh/release-notes/components", () => ({
  ReleaseTimeline: ({ releases, summaries, currentVersion }: any) => (
    <div data-testid="release-timeline">
      {releases.map((r: any) => (
        <div key={r.id} data-testid={`release-${r.id}`}>
          {r.title}
        </div>
      ))}
      <span data-testid="version">{currentVersion}</span>
    </div>
  ),
}));

// Mock load more action
const mockLoadMoreReleases = vi.fn();
vi.mock("@/lib/releases/actions", () => ({
  loadMoreReleases: (...args: any[]) => mockLoadMoreReleases(...args),
}));

import { ReleaseTimelineWithLoadMore } from "./ReleaseTimelineWithLoadMore";

describe("ReleaseTimelineWithLoadMore", () => {
  const mockRelease = {
    id: "1",
    slug: "release-1",
    version: "1.0.0",
    title: "Release 1",
    summary: "Test summary",
    dateReleased: "2024-01-01",
    project: { id: "1", name: "Test", slug: "test" },
  };

  const defaultProps = {
    initialReleases: [mockRelease],
    initialSummaries: { "1": <div>Summary 1</div> },
    initialHasMore: true,
    currentVersion: "1.0.0",
    projectSlug: "test-project",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initial rendering", () => {
    it("renders release timeline with initial releases", () => {
      render(<ReleaseTimelineWithLoadMore {...defaultProps} />);

      expect(screen.getByTestId("release-timeline")).toBeInTheDocument();
      expect(screen.getByTestId("release-1")).toBeInTheDocument();
      expect(screen.getByText("Release 1")).toBeInTheDocument();
    });

    it("renders current version", () => {
      render(<ReleaseTimelineWithLoadMore {...defaultProps} currentVersion="2.0.0" />);

      expect(screen.getByTestId("version")).toHaveTextContent("2.0.0");
    });

    it("renders load more button when hasMore is true", () => {
      render(<ReleaseTimelineWithLoadMore {...defaultProps} initialHasMore={true} />);

      expect(screen.getByRole("button", { name: "Load more" })).toBeInTheDocument();
    });

    it("does not render load more button when hasMore is false", () => {
      render(<ReleaseTimelineWithLoadMore {...defaultProps} initialHasMore={false} />);

      expect(screen.queryByRole("button", { name: "Load more" })).not.toBeInTheDocument();
    });
  });

  describe("loading more releases", () => {
    it("calls loadMoreReleases with correct offset and projectSlug", async () => {
      mockLoadMoreReleases.mockResolvedValue({
        success: true,
        releases: [],
        summaries: {},
        hasMore: false,
      });

      render(<ReleaseTimelineWithLoadMore {...defaultProps} />);

      fireEvent.click(screen.getByRole("button", { name: "Load more" }));

      await waitFor(() => {
        expect(mockLoadMoreReleases).toHaveBeenCalledWith(1, "test-project");
      });
    });

    it("appends new releases to existing ones", async () => {
      const newRelease = {
        ...mockRelease,
        id: "2",
        title: "Release 2",
      };

      mockLoadMoreReleases.mockResolvedValue({
        success: true,
        releases: [newRelease],
        summaries: { "2": <div>Summary 2</div> },
        hasMore: false,
      });

      render(<ReleaseTimelineWithLoadMore {...defaultProps} />);

      fireEvent.click(screen.getByRole("button", { name: "Load more" }));

      await waitFor(() => {
        expect(screen.getByTestId("release-1")).toBeInTheDocument();
        expect(screen.getByTestId("release-2")).toBeInTheDocument();
      });
    });

    it("hides load more button when no more releases", async () => {
      mockLoadMoreReleases.mockResolvedValue({
        success: true,
        releases: [{ ...mockRelease, id: "2" }],
        summaries: {},
        hasMore: false,
      });

      render(<ReleaseTimelineWithLoadMore {...defaultProps} />);

      fireEvent.click(screen.getByRole("button", { name: "Load more" }));

      await waitFor(() => {
        expect(screen.queryByRole("button", { name: "Load more" })).not.toBeInTheDocument();
      });
    });

    it("shows loading state while fetching", async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockLoadMoreReleases.mockReturnValue(promise);

      render(<ReleaseTimelineWithLoadMore {...defaultProps} />);

      fireEvent.click(screen.getByRole("button", { name: "Load more" }));

      // Button should show loading state
      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Loading..." })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Loading..." })).toBeDisabled();
      });

      // Resolve the promise
      resolvePromise!({
        success: true,
        releases: [],
        summaries: {},
        hasMore: false,
      });
    });

    it("does not update state on failed request", async () => {
      mockLoadMoreReleases.mockResolvedValue({
        success: false,
        error: "Failed to load",
      });

      render(<ReleaseTimelineWithLoadMore {...defaultProps} />);

      fireEvent.click(screen.getByRole("button", { name: "Load more" }));

      await waitFor(() => {
        // Original release should still be there
        expect(screen.getByTestId("release-1")).toBeInTheDocument();
        // Load more button should still be visible (hasMore wasn't updated)
        expect(screen.getByRole("button", { name: "Load more" })).toBeInTheDocument();
      });
    });
  });

  describe("multiple releases", () => {
    it("renders all initial releases", () => {
      const releases = [
        mockRelease,
        { ...mockRelease, id: "2", title: "Release 2" },
        { ...mockRelease, id: "3", title: "Release 3" },
      ];

      render(
        <ReleaseTimelineWithLoadMore
          {...defaultProps}
          initialReleases={releases}
        />
      );

      expect(screen.getByTestId("release-1")).toBeInTheDocument();
      expect(screen.getByTestId("release-2")).toBeInTheDocument();
      expect(screen.getByTestId("release-3")).toBeInTheDocument();
    });

    it("calculates correct offset based on releases length", async () => {
      const releases = [
        mockRelease,
        { ...mockRelease, id: "2" },
        { ...mockRelease, id: "3" },
      ];

      mockLoadMoreReleases.mockResolvedValue({
        success: true,
        releases: [],
        summaries: {},
        hasMore: false,
      });

      render(
        <ReleaseTimelineWithLoadMore
          {...defaultProps}
          initialReleases={releases}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: "Load more" }));

      await waitFor(() => {
        expect(mockLoadMoreReleases).toHaveBeenCalledWith(3, "test-project");
      });
    });
  });
});
