import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { BlogBrowser } from "../../components/browse/BlogBrowser";
import type { PostListItem, Series } from "../../types";

const post = (slug: string, overrides: Partial<PostListItem> = {}): PostListItem => ({
  id: slug,
  title: `Title ${slug}`,
  slug,
  excerpt: `Excerpt ${slug}`,
  date: "2026-10-05",
  readingTime: 3,
  persona: { id: "p", name: "Founder", slug: "founder", color: "#fff" },
  tags: [],
  ...overrides,
});

const series: Series[] = [{ id: "s1", title: "Stand-up", slug: "stand-up" }];
const tags = ["a", "b", "c", "d", "e"].map((slug) => ({ id: slug, name: slug, slug }));

const posts = [
  post("second", { seriesId: "s1", date: "2026-11-01", tags }),
  post("plain", { date: "2026-10-05" }),
  post("first", { seriesId: "s1", date: "2025-12-17" }),
];

describe("BlogBrowser", () => {
  it("shows a Submit button only when given a target", () => {
    const { rerender } = render(<BlogBrowser posts={posts} series={series} view="cards" />);
    expect(screen.queryByRole("link", { name: "Submit" })).not.toBeInTheDocument();

    rerender(<BlogBrowser posts={posts} series={series} view="cards" submitHref="/blog/submit" />);
    const submit = screen.getByRole("link", { name: "Submit" });
    expect(submit).toHaveAttribute("href", "/blog/submit");
    // Outside the view tabs, so it never looks like a fourth view
    expect(within(screen.getByRole("navigation", { name: "Blog view" })).queryByRole("link", { name: "Submit" })).toBeNull();
  });

  it("shows every post as a tile linking to it", () => {
    render(<BlogBrowser posts={posts} series={series} view="cards" />);

    expect(screen.getByText("3 posts")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Title plain" }).closest("a")).toHaveAttribute(
      "href",
      "/blog/plain",
    );
  });

  it("caps the tags on a tile", () => {
    render(<BlogBrowser posts={posts} series={series} view="cards" />);

    const tile = screen.getByRole("heading", { name: "Title second" }).closest("article")!;
    expect(within(tile).getByText("c")).toBeInTheDocument();
    expect(within(tile).queryByText("d")).not.toBeInTheDocument();
    expect(within(tile).getByText("+2")).toBeInTheDocument();
  });

  it("leaves out a missing reading time", () => {
    // Directus returns null for posts that never had one set
    const untimed = post("untimed", { readingTime: null as unknown as number });
    render(<BlogBrowser posts={[untimed]} view="cards" />);

    expect(screen.queryByText(/min read/)).not.toBeInTheDocument();
  });

  it("narrows the posts while typing", async () => {
    render(<BlogBrowser posts={posts} series={series} view="cards" />);

    await userEvent.type(screen.getByRole("searchbox", { name: "Search posts" }), "plain");

    expect(screen.getByText("1 post")).toBeInTheDocument();
    expect(screen.queryByText("Title second")).not.toBeInTheDocument();
  });

  it("explains an empty result and can clear it", async () => {
    render(
      <BlogBrowser posts={posts} series={series} view="cards" initialFilters={{ query: "nothing" }} />,
    );

    expect(screen.getByText("No posts match these filters")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Clear" }));

    expect(screen.getByText("3 posts")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
  });

  it("keeps a post's part number when its series is partly filtered out", () => {
    render(
      <BlogBrowser posts={posts} series={series} view="cards" initialFilters={{ month: "2026-11" }} />,
    );

    expect(screen.getByRole("link", { name: "Stand-up · Post 2" })).toBeInTheDocument();
  });

  it("renders the timeline view oldest first when sorted", () => {
    render(
      <BlogBrowser posts={posts} series={series} view="timeline" initialFilters={{ sort: "oldest" }} />,
    );

    const years = screen.getAllByText(/^20\d\d$/).map((node) => node.textContent);
    expect(years).toEqual(["2025", "2026"]);
  });

  it("offers the series filter and view only when a series has posts", () => {
    const { unmount } = render(<BlogBrowser posts={posts} series={series} view="cards" />);
    expect(screen.getByRole("combobox", { name: "Filter by series" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Series" })).toBeInTheDocument();
    unmount();

    render(<BlogBrowser posts={[post("plain")]} series={series} view="cards" />);
    expect(screen.queryByRole("combobox", { name: "Filter by series" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Series" })).not.toBeInTheDocument();
  });
});
