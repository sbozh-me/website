import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
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
        tagline: "Personal startup project",
        status: "beta",
      };
    }
    if (slug === "tecraft") {
      return {
        slug: "tecraft",
        title: "tecraft.cz",
        tagline: "Crystal keepsakes project",
        status: "beta",
      };
    }
    return null;
  }),
  getProjects: vi.fn(() => [
    { slug: "sbozh-me" },
    { slug: "tecraft" },
  ]),
}));

// Mock content functions
vi.mock("@/lib/projects/content/sbozh-me", () => ({
  getSbozhMeTabContent: vi.fn((tabId) => {
    if (tabId === "about") {
      return "## About sbozh.me\n\nThis is the about content for sbozh.me project.";
    }
    return null;
  }),
}));

vi.mock("@/lib/projects/content/tecraft", () => ({
  getTecraftTabContent: vi.fn((tabId) => {
    if (tabId === "about") {
      return "## About tecraft.cz\n\nThis is the about content for tecraft.cz.";
    }
    return null;
  }),
}));

import ProjectPage, { generateStaticParams } from "./page";

describe("ProjectPage", () => {
  describe("generateStaticParams", () => {
    it("returns params for all projects", async () => {
      const params = await generateStaticParams();
      expect(params).toEqual([
        { slug: "sbozh-me" },
        { slug: "tecraft" },
      ]);
    });
  });

  describe("rendering", () => {
    it("renders sbozh.me project content", async () => {
      const params = Promise.resolve({ slug: "sbozh-me" });
      const Page = await ProjectPage({ params });
      render(Page);

      const prose = screen.getByText(/Mocked MDX Content/);
      expect(prose).toBeInTheDocument();
    });

    it("renders tecraft project content", async () => {
      const params = Promise.resolve({ slug: "tecraft" });
      const Page = await ProjectPage({ params });
      render(Page);

      const prose = screen.getByText(/Mocked MDX Content/);
      expect(prose).toBeInTheDocument();
    });

    it("calls notFound for non-existent project", async () => {
      const { notFound } = await import("next/navigation");
      const params = Promise.resolve({ slug: "non-existent" });

      try {
        await ProjectPage({ params });
      } catch (e) {
        // notFound throws an error internally
      }

      expect(notFound).toHaveBeenCalled();
    });

    it("renders coming soon for projects without content", async () => {
      // Mock to return no content
      const { getSbozhMeTabContent } = await import("@/lib/projects/content/sbozh-me");
      (getSbozhMeTabContent as any).mockReturnValueOnce(null);

      const params = Promise.resolve({ slug: "sbozh-me" });
      const Page = await ProjectPage({ params });
      render(Page);

      expect(screen.getByText("About")).toBeInTheDocument();
      expect(screen.getByText("Content coming soon...")).toBeInTheDocument();
    });
  });

  describe("prose styling", () => {
    it("applies prose classes to content wrapper", async () => {
      const params = Promise.resolve({ slug: "sbozh-me" });
      const Page = await ProjectPage({ params });
      const { container } = render(Page);

      const proseDiv = container.querySelector(".prose");
      expect(proseDiv).toBeInTheDocument();
      expect(proseDiv).toHaveClass("prose", "max-w-none");
    });
  });
});