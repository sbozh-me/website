import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PostListItem, Tag } from "@sbozh/blog";

import { LatestPublications } from "./LatestPublications";

function tag(id: string, name = id): Tag {
  return { id, slug: id, name };
}

function fixture(id: string, title: string, tags: Tag[] = []): PostListItem {
  return {
    id,
    slug: id,
    title,
    excerpt: "",
    date: "2026-01-01",
    readingTime: 0,
    persona: { id: "sem", slug: "sem", name: "Sem", color: "amethyst" },
    tags,
    type: "articles",
  };
}

function many(n: number, tags: Tag[] = []) {
  return Array.from({ length: n }, (_, i) => fixture(`p${i}`, `Post ${i}`, tags));
}

describe("LatestPublications", () => {
  it("renders nothing when there are no posts", () => {
    const { container } = render(<LatestPublications posts={[]} viewAllHref="/library/all" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the first five tiles and a Left tile for the rest", () => {
    render(<LatestPublications posts={many(8)} viewAllHref="/library/all" />);
    const grid = screen.getByRole("heading", { name: "Latest publications" }).closest("section")!;
    expect(within(grid).getAllByRole("article")).toHaveLength(5);
    expect(screen.getByRole("button", { name: /Load 3 more/i })).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Left")).toBeInTheDocument();
  });

  it("the Load more button bumps the tile count by five", () => {
    render(<LatestPublications posts={many(12)} viewAllHref="/library/all" />);
    fireEvent.click(screen.getByRole("button", { name: /Load 5 more/i }));
    expect(screen.getAllByRole("article")).toHaveLength(10);
    // Still 2 to go
    expect(screen.getByRole("button", { name: /Load 2 more/i })).toBeInTheDocument();
  });

  it("hides the Load more tile once every post is shown", () => {
    render(<LatestPublications posts={many(5)} viewAllHref="/library/all" />);
    expect(screen.queryByRole("button", { name: /Load \d+ more/i })).toBeNull();
  });

  it("links the View all link to the given href", () => {
    render(<LatestPublications posts={many(3)} viewAllHref="/library/all" />);
    expect(screen.getByRole("link", { name: /View all/i })).toHaveAttribute(
      "href",
      "/library/all",
    );
  });

  it("opens the tag accordion only when there are posts with tags", () => {
    render(<LatestPublications posts={many(3)} viewAllHref="/library/all" />);
    fireEvent.click(screen.getByRole("button", { name: /Latest publications/ }));
    // No tags → nothing to show
    expect(screen.queryByRole("searchbox")).toBeNull();
  });

  it("filters the grid when a tag chip is picked and resets on All", () => {
    const rust = tag("rust", "Rust");
    const code = tag("code", "Code");
    const posts: PostListItem[] = [
      fixture("a", "A", [rust, code]),
      fixture("b", "B", [code]),
      fixture("c", "C", []),
      fixture("d", "D", [rust]),
    ];
    render(<LatestPublications posts={posts} viewAllHref="/library/all" />);
    fireEvent.click(screen.getByRole("button", { name: /Latest publications/ }));
    const rustChip = screen.getByRole("button", { name: "Rust" });
    fireEvent.click(rustChip);
    expect(screen.getAllByRole("article")).toHaveLength(2);
    expect(rustChip).toHaveAttribute("aria-pressed", "true");
    const allChip = screen.getByRole("button", { name: "All" });
    fireEvent.click(allChip);
    expect(screen.getAllByRole("article")).toHaveLength(4);
    expect(allChip).toHaveAttribute("aria-pressed", "true");
  });

  it("clicking the active tag again clears the filter", () => {
    const rust = tag("rust", "Rust");
    render(
      <LatestPublications
        posts={[fixture("a", "A", [rust]), fixture("b", "B", [])]}
        viewAllHref="/library/all"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Latest publications/ }));
    const rustChip = screen.getByRole("button", { name: "Rust" });
    fireEvent.click(rustChip);
    expect(screen.getAllByRole("article")).toHaveLength(1);
    fireEvent.click(rustChip);
    expect(screen.getAllByRole("article")).toHaveLength(2);
    expect(rustChip).toHaveAttribute("aria-pressed", "false");
  });

  it("the tag search input narrows the chip list", () => {
    const rust = tag("rust", "Rust");
    const code = tag("code", "Code");
    const posts: PostListItem[] = [
      fixture("a", "A", [rust]),
      fixture("b", "B", [code]),
    ];
    render(<LatestPublications posts={posts} viewAllHref="/library/all" />);
    fireEvent.click(screen.getByRole("button", { name: /Latest publications/ }));
    const search = screen.getByRole("searchbox");
    fireEvent.change(search, { target: { value: "ru" } });
    expect(screen.getByRole("button", { name: "Rust" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Code" })).toBeNull();
    fireEvent.change(search, { target: { value: "zzzzz" } });
    expect(screen.getByText("No tags match.")).toBeInTheDocument();
  });
});
