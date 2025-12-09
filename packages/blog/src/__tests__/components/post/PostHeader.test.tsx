import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PostHeader } from "../../../components/post/PostHeader";
import type { Post } from "../../../types";

const mockPost: Post = {
  id: "1",
  title: "Test Post Title",
  slug: "test-post",
  excerpt: "Test excerpt",
  content: "Test content",
  date: "2025-12-09",
  readingTime: 5,
  persona: {
    id: "1",
    name: "The Founder",
    slug: "founder",
    color: "#8b5cf6",
  },
  tags: [
    { id: "1", name: "Tech", slug: "tech" },
    { id: "2", name: "Startup", slug: "startup" },
  ],
};

describe("PostHeader", () => {
  it("renders post title", () => {
    render(<PostHeader post={mockPost} />);

    expect(screen.getByText("Test Post Title")).toBeInTheDocument();
  });

  it("renders persona name", () => {
    render(<PostHeader post={mockPost} />);

    expect(screen.getByText("The Founder")).toBeInTheDocument();
  });

  it("renders formatted date", () => {
    render(<PostHeader post={mockPost} />);

    const timeElement = screen.getByText("Dec 9");
    expect(timeElement).toBeInTheDocument();
    expect(timeElement.tagName).toBe("TIME");
    expect(timeElement).toHaveAttribute("datetime", "2025-12-09");
  });

  it("renders reading time", () => {
    render(<PostHeader post={mockPost} />);

    expect(screen.getByText("5 min read")).toBeInTheDocument();
  });

  it("renders all tags", () => {
    render(<PostHeader post={mockPost} />);

    expect(screen.getByText("Tech")).toBeInTheDocument();
    expect(screen.getByText("Startup")).toBeInTheDocument();
  });

  it("does not render tags section when no tags", () => {
    const postWithoutTags = { ...mockPost, tags: [] };
    const { container } = render(<PostHeader post={postWithoutTags} />);

    expect(screen.queryByText("Tech")).not.toBeInTheDocument();
    expect(container.querySelector('[class*="flex-wrap"]')).not.toBeInTheDocument();
  });

  it("renders persona dot with correct color", () => {
    const { container } = render(<PostHeader post={mockPost} />);

    const dot = container.querySelector('[aria-hidden="true"]');
    expect(dot).toHaveStyle({ backgroundColor: "#8b5cf6" });
  });
});
