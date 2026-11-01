import { describe, expect, it } from "vitest";

import {
  blogHref,
  filterPosts,
  getFilterOptions,
  parsePostFilters,
} from "../../utils/post-filters";
import type { PostListItem, Series } from "../../types";

const persona = (slug: string) => ({ id: slug, name: slug.toUpperCase(), slug, color: "#fff" });
const tag = (slug: string) => ({ id: slug, name: slug, slug });

const post = (slug: string, overrides: Partial<PostListItem> = {}): PostListItem => ({
  id: slug,
  title: slug,
  slug,
  excerpt: "",
  date: "2026-10-05",
  readingTime: 1,
  persona: persona("founder"),
  tags: [],
  ...overrides,
});

// Newest first, as the repository returns them
const posts = [
  post("newest", { date: "2026-11-01", tags: [tag("ai")], persona: persona("architect") }),
  post("middle", {
    date: "2026-10-05",
    title: "How to Pitch",
    tags: [tag("ai"), tag("ads")],
    seriesId: "s1",
  }),
  post("oldest", { date: "2025-12-17", excerpt: "A quiet START", seriesId: "s2" }),
];

const series: Series[] = [
  { id: "s1", title: "Stand-up", slug: "stand-up" },
  { id: "s2", title: "Other", slug: "other" },
  { id: "s3", title: "Unpublished", slug: "unpublished" },
];

const slugs = (list: PostListItem[]) => list.map((item) => item.slug);

describe("filterPosts", () => {
  it("returns everything without filters", () => {
    expect(slugs(filterPosts(posts, {}))).toEqual(["newest", "middle", "oldest"]);
  });

  it("filters by series slug", () => {
    expect(slugs(filterPosts(posts, { series: "stand-up" }, series))).toEqual(["middle"]);
  });

  it("finds nothing for an unknown series", () => {
    expect(filterPosts(posts, { series: "nope" }, series)).toEqual([]);
  });

  it("does not match posts outside any series to an unknown series", () => {
    expect(filterPosts([post("plain")], { series: "nope" }, [])).toEqual([]);
  });

  it("filters by tag", () => {
    expect(slugs(filterPosts(posts, { tag: "ai" }))).toEqual(["newest", "middle"]);
  });

  it("filters by persona", () => {
    expect(slugs(filterPosts(posts, { persona: "architect" }))).toEqual(["newest"]);
  });

  it("filters by month", () => {
    expect(slugs(filterPosts(posts, { month: "2025-12" }))).toEqual(["oldest"]);
  });

  it("searches titles and excerpts, ignoring case and outer spaces", () => {
    expect(slugs(filterPosts(posts, { query: " pitch " }))).toEqual(["middle"]);
    expect(slugs(filterPosts(posts, { query: "start" }))).toEqual(["oldest"]);
  });

  it("combines filters", () => {
    expect(slugs(filterPosts(posts, { tag: "ai", persona: "founder" }))).toEqual(["middle"]);
  });

  it("sorts oldest first without touching the original list", () => {
    expect(slugs(filterPosts(posts, { sort: "oldest" }))).toEqual(["oldest", "middle", "newest"]);
    expect(slugs(posts)).toEqual(["newest", "middle", "oldest"]);
  });
});

describe("getFilterOptions", () => {
  const options = getFilterOptions(posts, series);

  it("offers only series with published posts", () => {
    expect(options.series.map((item) => item.slug).sort()).toEqual(["other", "stand-up"]);
  });

  it("lists each tag and persona once, by name", () => {
    expect(options.tags.map((item) => item.slug)).toEqual(["ads", "ai"]);
    expect(options.personas.map((item) => item.slug)).toEqual(["architect", "founder"]);
  });

  it("lists months newest first with readable labels", () => {
    expect(options.months).toEqual([
      { value: "2026-11", label: "November 2026" },
      { value: "2026-10", label: "October 2026" },
      { value: "2025-12", label: "December 2025" },
    ]);
  });
});

describe("parsePostFilters", () => {
  it("reads every filter", () => {
    expect(
      parsePostFilters({
        series: "stand-up",
        tag: "ai",
        persona: "founder",
        month: "2026-10",
        q: "pitch",
        sort: "oldest",
      }),
    ).toEqual({
      series: "stand-up",
      tag: "ai",
      persona: "founder",
      month: "2026-10",
      query: "pitch",
      sort: "oldest",
    });
  });

  it("leaves out malformed values", () => {
    expect(parsePostFilters({ month: "2026-13", sort: "random", tag: ["a", "b"], q: "" })).toEqual({});
  });

  it("ignores parameters it doesn't know", () => {
    expect(parsePostFilters({ view: "timeline", utm_source: "x" })).toEqual({});
  });
});

describe("blogHref", () => {
  it("keeps the default view clean", () => {
    expect(blogHref("cards")).toBe("/blog");
  });

  it("names other views", () => {
    expect(blogHref("timeline")).toBe("/blog?view=timeline");
  });

  it("round-trips filters through the URL, including spaces in slugs", () => {
    const filters = { tag: "Bug reports", persona: "chair 26B", query: "a b", sort: "oldest" as const };
    const search = new URLSearchParams(blogHref("timeline", filters).split("?")[1]);

    expect(parsePostFilters(Object.fromEntries(search))).toEqual(filters);
  });

  it("drops post filters on the way to the series view", () => {
    expect(blogHref("series", { tag: "ai" })).toBe("/blog?view=series");
  });
});
