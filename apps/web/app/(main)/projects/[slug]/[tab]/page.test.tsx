import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "fs";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
}));

// Mock file system
vi.mock("fs", () => ({
  readFileSync: vi.fn(),
  default: {
    readFileSync: vi.fn(),
  },
}));

// Mock MDX evaluation
vi.mock("@mdx-js/mdx", () => ({
  evaluate: vi.fn(async (content) => ({
    default: ({ components }: any) => (
      <div>
        <h2>Mocked MDX Content</h2>
        <p>{content.slice(0, 50)}</p>
      </div>
    ),
  })),
}));

// Mock project data
vi.mock("@/lib/projects/data", () => ({
  getProject: vi.fn((slug: string) => {
    if (slug === "sbozh-me") {
      return {
        slug: "sbozh-me",
        title: "sbozh.me",
        version: "0.8.5",
        tabs: [
          { id: "about", label: "About", enabled: true },
          { id: "roadmap", label: "Roadmap", enabled: true },
          { id: "changelog", label: "Changelog", enabled: true },
        ],
      };
    }
    if (slug === "discord-community") {
      return {
        slug: "discord-community",
        title: "Discord Community",
        version: "0.1.0",
        tabs: [
          { id: "about", label: "About", enabled: true },
          { id: "roadmap", label: "Roadmap", enabled: true },
        ],
      };
    }
    return null;
  }),
  getProjects: vi.fn(() => [
    {
      slug: "sbozh-me",
      tabs: [
        { id: "roadmap", enabled: true },
        { id: "changelog", enabled: true },
      ],
    },
    {
      slug: "discord-community",
      tabs: [
        { id: "roadmap", enabled: true },
      ],
    },
  ]),
}));

// Mock content functions
vi.mock("@/lib/projects/content/sbozh-me", () => ({
  getSbozhMeTabContent: vi.fn((tabId) => {
    if (tabId === "features") {
      return "## Features\n\nFeatures content for sbozh.me.";
    }
    return null;
  }),
}));

vi.mock("@/lib/projects/content/discord-community", () => ({
  getDiscordCommunityTabContent: vi.fn((tabId) => {
    if (tabId === "guidelines") {
      return "## Guidelines\n\nGuidelines content for Discord Community.";
    }
    return null;
  }),
  getDiscordCommunityRoadmapData: vi.fn(() => ({
    roadmap: "## 0.1.0\n\n- Task 1",
    backlog: "## Ideas\n\n- Idea 1",
  })),
}));

// Mock parsers
vi.mock("@/lib/changelog/parser", () => ({
  parseChangelogFromContent: vi.fn(() => [
    { version: "0.8.5", date: "2024-01-01", items: ["Feature 1"] },
  ]),
}));

vi.mock("@/lib/roadmap/parser", () => ({
  parseRoadmapFromContent: vi.fn(() => ({
    data: [{ version: "0.9.0", items: ["Task 1"] }],
    completedCount: 5,
    totalCount: 10,
  })),
  parseBacklogFromContent: vi.fn(() => [
    { category: "Ideas", items: ["Idea 1"] },
  ]),
}));

// Mock UI components
vi.mock("@sbozh/react-ui/components/ui/vertical-timeline", () => ({
  VerticalTimeline: ({ data }: any) => (
    <div data-testid="vertical-timeline">
      {data.map((item: any, i: number) => (
        <div key={i}>{item.version}</div>
      ))}
    </div>
  ),
}));

vi.mock("@/components/roadmap", () => ({
  RoadmapView: ({ completedCount, totalCount }: any) => (
    <div data-testid="roadmap-view">
      Progress: {completedCount}/{totalCount}
    </div>
  ),
}));

import TabPage, { generateStaticParams } from "./page";

describe("TabPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateStaticParams", () => {
    it("returns params for all enabled tabs", async () => {
      const params = await generateStaticParams();
      expect(params).toContainEqual({ slug: "sbozh-me", tab: "roadmap" });
      expect(params).toContainEqual({ slug: "sbozh-me", tab: "changelog" });
      expect(params).toContainEqual({ slug: "discord-community", tab: "roadmap" });
    });
  });

  describe("changelog rendering", () => {
    it("renders sbozh.me changelog", async () => {
      (readFileSync as any).mockReturnValue("# Changelog\n\n## 0.8.5");
      const params = Promise.resolve({ slug: "sbozh-me", tab: "changelog" });
      const Page = await TabPage({ params });
      render(Page);

      expect(screen.getByText("Changelog")).toBeInTheDocument();
      expect(screen.getByTestId("vertical-timeline")).toBeInTheDocument();
      expect(screen.getByText("0.8.5")).toBeInTheDocument();
    });
  });

  describe("roadmap rendering", () => {
    it("renders sbozh.me roadmap", async () => {
      (readFileSync as any).mockReturnValue("# Roadmap\n\n## 0.9.0");
      const params = Promise.resolve({ slug: "sbozh-me", tab: "roadmap" });
      const Page = await TabPage({ params });
      render(Page);

      expect(screen.getByText("Roadmap")).toBeInTheDocument();
      expect(screen.getByTestId("roadmap-view")).toBeInTheDocument();
      expect(screen.getByText("Progress: 5/10")).toBeInTheDocument();
    });

    it("renders discord-community roadmap", async () => {
      const params = Promise.resolve({ slug: "discord-community", tab: "roadmap" });
      const Page = await TabPage({ params });
      render(Page);

      expect(screen.getByText("Roadmap")).toBeInTheDocument();
      expect(screen.getByTestId("roadmap-view")).toBeInTheDocument();
    });
  });

  describe("MDX content rendering", () => {
    it("renders MDX content when available", async () => {
      const { getSbozhMeTabContent } = await import("@/lib/projects/content/sbozh-me");
      (getSbozhMeTabContent as any).mockReturnValueOnce("## Custom Tab\n\nCustom content");

      const params = Promise.resolve({ slug: "sbozh-me", tab: "about" });
      const Page = await TabPage({ params });
      render(Page);

      expect(screen.getByText("Mocked MDX Content")).toBeInTheDocument();
    });

    it("renders coming soon when no content", async () => {
      const params = Promise.resolve({ slug: "sbozh-me", tab: "about" });
      const Page = await TabPage({ params });
      render(Page);

      expect(screen.getByText("About")).toBeInTheDocument();
      expect(screen.getByText(/Content for About coming soon/)).toBeInTheDocument();
    });
  });

  describe("error handling", () => {
    it("calls notFound for non-existent project", async () => {
      const { notFound } = await import("next/navigation");
      const params = Promise.resolve({ slug: "non-existent", tab: "about" });

      try {
        await TabPage({ params });
      } catch (e) {
        // notFound throws an error internally
      }

      expect(notFound).toHaveBeenCalled();
    });

    it("calls notFound for disabled tab", async () => {
      const { notFound } = await import("next/navigation");
      const params = Promise.resolve({ slug: "sbozh-me", tab: "disabled-tab" });

      try {
        await TabPage({ params });
      } catch (e) {
        // notFound throws an error internally
      }

      expect(notFound).toHaveBeenCalled();
    });
  });
});