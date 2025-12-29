import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import NotFound from "@/app/not-found";

// Mock the components
vi.mock("@/components/Header", () => ({
  Header: () => <div data-testid="header">Header</div>,
}));

vi.mock("@sbozh/blog/components", () => ({
  PostCard: ({ post }: { post: any }) => (
    <div data-testid="post-card">
      <h3>{post.title}</h3>
      <p>{post.excerpt}</p>
    </div>
  ),
}));

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    blockquote: ({ children, ...props }: any) => (
      <blockquote {...props}>{children}</blockquote>
    ),
  },
}));

describe("NotFound", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it("renders 404 header and quote", () => {
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ error: "No posts found" }),
    });

    render(<NotFound />);

    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText("Page Not Found")).toBeInTheDocument();
    expect(
      screen.getByText(/"After all, the wrong road always leads somewhere."/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/George Bernard Shaw/i)).toBeInTheDocument();
  });

  it("renders Header component", () => {
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ error: "No posts found" }),
    });

    render(<NotFound />);

    expect(screen.getByTestId("header")).toBeInTheDocument();
  });

  it("shows skeleton loader while fetching random post", () => {
    (global.fetch as any).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () =>
              resolve({
                json: async () => ({
                  id: "1",
                  title: "Test Post",
                  slug: "test-post",
                  excerpt: "Test excerpt",
                  date: "2024-01-01",
                  readingTime: 5,
                  persona: { id: "1", name: "Test", slug: "test", color: "#000" },
                  tags: [],
                }),
              }),
            100
          );
        })
    );

    render(<NotFound />);

    // Skeleton should be visible initially
    const skeleton = document.querySelector(".animate-pulse");
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass("h-[195.5px]");
  });

  it("renders random blog post when fetch succeeds", async () => {
    const mockPost = {
      id: "1",
      title: "Random Blog Post",
      slug: "random-post",
      excerpt: "This is a random post excerpt",
      date: "2024-01-01",
      readingTime: 5,
      persona: { id: "1", name: "Test", slug: "test", color: "#8b5cf6" },
      tags: [],
    };

    (global.fetch as any).mockResolvedValueOnce({
      json: async () => mockPost,
    });

    render(<NotFound />);

    await waitFor(() => {
      expect(screen.getByTestId("post-card")).toBeInTheDocument();
    });

    expect(screen.getByText("Random Blog Post")).toBeInTheDocument();
    expect(
      screen.getByText("This is a random post excerpt")
    ).toBeInTheDocument();
  });

  it("does not render post card when fetch fails", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ error: "No posts found" }),
    });

    render(<NotFound />);

    await waitFor(() => {
      expect(screen.queryByTestId("post-card")).not.toBeInTheDocument();
    });
  });

  it("renders back to homepage button", () => {
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ error: "No posts found" }),
    });

    render(<NotFound />);

    const button = screen.getByRole("link");
    expect(button).toHaveAttribute("href", "/");
    expect(screen.getByText("Back to Homepage")).toBeInTheDocument();
  });

  it("calls API to fetch random post on mount", () => {
    const fetchSpy = vi.fn().mockResolvedValueOnce({
      json: async () => ({ error: "No posts found" }),
    });
    global.fetch = fetchSpy;

    render(<NotFound />);

    expect(fetchSpy).toHaveBeenCalledWith("/api/blog/random");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("handles fetch errors gracefully", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

    render(<NotFound />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to fetch random post:",
        expect.any(Error)
      );
    });

    expect(screen.queryByTestId("post-card")).not.toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });
});