import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

// Variable to control mock behavior
let mockShouldThrow = false;

// Mock the repository
vi.mock("@/lib/blog/repository", () => ({
  createBlogRepository: () => ({
    getPosts: vi.fn(async () => {
      if (mockShouldThrow) {
        throw new Error("Connection failed");
      }
      const { MockBlogRepository } = await import("@sbozh/blog/data");
      const repo = new MockBlogRepository();
      return repo.getPosts();
    }),
  }),
  DirectusError: {
    fromError: (e: Error) => ({ message: e.message, status: 500 }),
  },
}));

import BlogPage from "./page";

describe("BlogPage", () => {
  beforeEach(() => {
    mockShouldThrow = false;
  });

  it("renders blog heading", async () => {
    render(await BlogPage());
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Blog");
  });

  it("renders timeline with posts", async () => {
    render(await BlogPage());
    // Should show year markers from mock data
    expect(screen.getByText("2025")).toBeInTheDocument();
    expect(screen.getByText("2024")).toBeInTheDocument();
  });

  it("renders post titles from mock data", async () => {
    render(await BlogPage());
    expect(screen.getByText("Why I started sbozh.me")).toBeInTheDocument();
    expect(screen.getByText("On patience and shipping")).toBeInTheDocument();
  });

  it("renders error state when repository throws", async () => {
    mockShouldThrow = true;
    render(await BlogPage());

    expect(screen.getByText("Unable to load posts")).toBeInTheDocument();
    expect(screen.getByText("Connection failed")).toBeInTheDocument();
  });
});
