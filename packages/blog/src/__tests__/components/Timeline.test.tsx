import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Timeline } from "../../components/timeline/Timeline";

import type { PostListItem } from "../../types/post";

const createPost = (id: string, date: string, title: string): PostListItem => ({
  id,
  title,
  slug: `post-${id}`,
  excerpt: `Excerpt for ${title}`,
  date,
  readingTime: 5,
  persona: { id: "1", slug: "dev", name: "Dev", color: "#3b82f6" },
  tags: [],
});

describe("Timeline", () => {
  it("renders empty when no posts", () => {
    const { container } = render(<Timeline posts={[]} />);

    expect(container.firstChild).toBeEmptyDOMElement();
  });

  it("renders year markers", () => {
    const posts = [
      createPost("1", "2024-06-15", "Post 2024"),
      createPost("2", "2023-06-15", "Post 2023"),
    ];
    render(<Timeline posts={posts} />);

    expect(screen.getByText("2024")).toBeInTheDocument();
    expect(screen.getByText("2023")).toBeInTheDocument();
  });

  it("renders month markers", () => {
    const posts = [
      createPost("1", "2024-06-15", "June Post"),
      createPost("2", "2024-03-15", "March Post"),
    ];
    render(<Timeline posts={posts} />);

    expect(screen.getByText("June")).toBeInTheDocument();
    expect(screen.getByText("March")).toBeInTheDocument();
  });

  it("renders post cards", () => {
    const posts = [
      createPost("1", "2024-06-15", "First Post"),
      createPost("2", "2024-06-10", "Second Post"),
    ];
    render(<Timeline posts={posts} />);

    expect(screen.getByText("First Post")).toBeInTheDocument();
    expect(screen.getByText("Second Post")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <Timeline posts={[]} className="custom-class" />,
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("groups posts correctly by year and month", () => {
    const posts = [
      createPost("1", "2024-12-15", "December 2024"),
      createPost("2", "2024-06-15", "June 2024"),
      createPost("3", "2023-12-15", "December 2023"),
    ];
    render(<Timeline posts={posts} />);

    // All should be rendered
    expect(screen.getByText("2024")).toBeInTheDocument();
    expect(screen.getByText("2023")).toBeInTheDocument();
    expect(screen.getByText("December 2024")).toBeInTheDocument();
    expect(screen.getByText("June 2024")).toBeInTheDocument();
    expect(screen.getByText("December 2023")).toBeInTheDocument();
  });
});
