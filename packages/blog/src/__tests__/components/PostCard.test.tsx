import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PostCard } from "../../components/timeline/PostCard";

import type { PostListItem } from "../../types/post";

const mockPost: PostListItem = {
  id: "1",
  title: "Test Post Title",
  slug: "test-post",
  excerpt: "This is a test excerpt for the post card.",
  date: "2024-06-15",
  readingTime: 5,
  persona: {
    id: "dev",
    slug: "developer",
    name: "Developer",
    color: "#3b82f6",
  },
  tags: [{ id: "1", slug: "react", name: "React" }],
};

describe("PostCard", () => {
  it("renders post title", () => {
    render(<PostCard post={mockPost} />);

    expect(
      screen.getByRole("heading", { name: "Test Post Title" }),
    ).toBeInTheDocument();
  });

  it("renders post excerpt", () => {
    render(<PostCard post={mockPost} />);

    expect(
      screen.getByText("This is a test excerpt for the post card."),
    ).toBeInTheDocument();
  });

  it("renders link to post", () => {
    render(<PostCard post={mockPost} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/blog/test-post");
  });

  it("renders reading time", () => {
    render(<PostCard post={mockPost} />);

    expect(screen.getByText("5 min read")).toBeInTheDocument();
  });

  it("renders formatted date", () => {
    render(<PostCard post={mockPost} />);

    expect(screen.getByText("Jun 15")).toBeInTheDocument();
  });

  it("renders persona name", () => {
    render(<PostCard post={mockPost} />);

    expect(screen.getByText("Developer")).toBeInTheDocument();
  });
});
