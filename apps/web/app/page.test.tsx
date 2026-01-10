import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock Next.js Link
vi.mock("next/link", () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

// Mock fs/promises
vi.mock("fs/promises", () => {
  const readFileMock = vi.fn(async () => JSON.stringify({ version: "1.0.0" }));
  return {
    readFile: readFileMock,
    default: { readFile: readFileMock },
  };
});

// Mock release repository
vi.mock("@/lib/releases/repository", () => ({
  createReleaseRepository: vi.fn(() => ({
    getReleases: vi.fn(async () => []),
  })),
  DirectusError: class DirectusError extends Error {},
}));

// Mock release-notes components
vi.mock("@sbozh/release-notes/components", () => ({
  ReleaseTimeline: () => <div data-testid="release-timeline">Release Timeline</div>,
  ReleaseTimelineEntry: () => <div>Release Entry</div>,
  ReleaseMediaCard: () => <div>Media Card</div>,
  CopyUrlButton: () => <button>Copy URL</button>,
  ErrorState: () => <div>Error</div>,
}));

// Mock ReleaseTimelineWithLoadMore
vi.mock("@/components/releases/ReleaseTimelineWithLoadMore", () => ({
  ReleaseTimelineWithLoadMore: () => <div data-testid="timeline">Timeline</div>,
}));

import Home from "./page";

describe("Home", () => {
  it("renders site title", async () => {
    const Page = await Home();
    render(Page);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "sbozh.me",
    );
  });

  it("renders tagline", async () => {
    const Page = await Home();
    render(Page);
    expect(screen.getByText(/Personal startup/)).toBeInTheDocument();
  });

  it("renders navigation links", async () => {
    const Page = await Home();
    render(Page);
    expect(screen.getByRole("link", { name: "Blog" })).toHaveAttribute(
      "href",
      "/blog",
    );
    expect(screen.getByRole("link", { name: "CV" })).toHaveAttribute(
      "href",
      "/cv",
    );
    expect(screen.getByRole("link", { name: "Projects" })).toHaveAttribute(
      "href",
      "/projects",
    );
  });
});
