import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock Next.js navigation
const mockPush = vi.fn();
const mockSearchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
  })),
  useSearchParams: vi.fn(() => mockSearchParams),
}));

// Mock child components
vi.mock("./ReleaseNotesTab", () => ({
  ReleaseNotesTab: ({ data, projectSlug }: any) => (
    <div data-testid="release-notes-tab">
      Release Notes Tab - {projectSlug}
    </div>
  ),
}));

vi.mock("./ChangelogTab", () => ({
  ChangelogTab: ({ data }: any) => (
    <div data-testid="changelog-tab">Changelog Tab</div>
  ),
}));

vi.mock("./RoadmapTab", () => ({
  RoadmapTab: ({ data }: any) => (
    <div data-testid="roadmap-tab">Roadmap Tab</div>
  ),
}));

import { ReleasesContent } from "./ReleasesContent";

describe("ReleasesContent", () => {
  const defaultProps = {
    projectSlug: "sbozh-me",
    activeTab: "notes",
    releaseNotesData: {
      success: true as const,
      releases: [],
      summaries: {},
      hasMore: false,
      currentVersion: "1.0.0",
    },
    changelogData: { groups: [] },
    roadmapData: {
      roadmapData: { groups: [] },
      backlogData: { groups: [] },
      completedCount: 0,
      totalCount: 0,
      currentVersion: "1.0.0",
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("tab rendering", () => {
    it("renders all three tab triggers", () => {
      render(<ReleasesContent {...defaultProps} />);

      expect(screen.getByRole("tab", { name: "Release Notes" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Changelog" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Roadmap" })).toBeInTheDocument();
    });

    it("shows release notes tab content when activeTab is notes", () => {
      render(<ReleasesContent {...defaultProps} activeTab="notes" />);

      expect(screen.getByTestId("release-notes-tab")).toBeInTheDocument();
    });

    it("shows changelog tab content when activeTab is changelog", () => {
      render(<ReleasesContent {...defaultProps} activeTab="changelog" />);

      // Click changelog tab to show its content
      fireEvent.click(screen.getByRole("tab", { name: "Changelog" }));
      expect(screen.getByTestId("changelog-tab")).toBeInTheDocument();
    });

    it("shows roadmap tab content when activeTab is roadmap", () => {
      render(<ReleasesContent {...defaultProps} activeTab="roadmap" />);

      // Click roadmap tab to show its content
      fireEvent.click(screen.getByRole("tab", { name: "Roadmap" }));
      expect(screen.getByTestId("roadmap-tab")).toBeInTheDocument();
    });
  });

  describe("tab validation", () => {
    it("defaults to notes tab for invalid tab value", () => {
      render(<ReleasesContent {...defaultProps} activeTab="invalid" />);

      expect(screen.getByTestId("release-notes-tab")).toBeInTheDocument();
    });

    it("defaults to notes tab for empty tab value", () => {
      render(<ReleasesContent {...defaultProps} activeTab="" />);

      expect(screen.getByTestId("release-notes-tab")).toBeInTheDocument();
    });
  });

  describe("tab navigation", () => {
    it("tabs are interactive and can be clicked", () => {
      render(<ReleasesContent {...defaultProps} />);

      const changelogTab = screen.getByRole("tab", { name: "Changelog" });
      const roadmapTab = screen.getByRole("tab", { name: "Roadmap" });
      const notesTab = screen.getByRole("tab", { name: "Release Notes" });

      // All tabs should be enabled and clickable
      expect(changelogTab).not.toBeDisabled();
      expect(roadmapTab).not.toBeDisabled();
      expect(notesTab).not.toBeDisabled();
    });

    it("notes tab is selected by default", () => {
      render(<ReleasesContent {...defaultProps} />);

      const notesTab = screen.getByRole("tab", { name: "Release Notes" });
      expect(notesTab).toHaveAttribute("data-state", "active");
    });

    it("changelog tab is selected when activeTab is changelog", () => {
      render(<ReleasesContent {...defaultProps} activeTab="changelog" />);

      const changelogTab = screen.getByRole("tab", { name: "Changelog" });
      expect(changelogTab).toHaveAttribute("data-state", "active");
    });

    it("roadmap tab is selected when activeTab is roadmap", () => {
      render(<ReleasesContent {...defaultProps} activeTab="roadmap" />);

      const roadmapTab = screen.getByRole("tab", { name: "Roadmap" });
      expect(roadmapTab).toHaveAttribute("data-state", "active");
    });
  });

  describe("props passing", () => {
    it("passes projectSlug to ReleaseNotesTab", () => {
      render(<ReleasesContent {...defaultProps} projectSlug="my-project" />);

      expect(screen.getByTestId("release-notes-tab")).toHaveTextContent("my-project");
    });
  });
});
