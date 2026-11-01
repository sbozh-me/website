import { describe, expect, it } from "vitest";

import { getSeriesParts, getSeriesWithPosts } from "../../utils/series";
import type { PostListItem, Series } from "../../types";

function makePost(slug: string, seriesId?: string): PostListItem {
  return {
    id: slug,
    title: slug,
    slug,
    excerpt: "",
    date: "2026-01-01",
    readingTime: 1,
    persona: { id: "1", name: "P", slug: "p", color: "#fff" },
    tags: [],
    seriesId,
  };
}

const older: Series = { id: "older", title: "Older", slug: "older" };
const newer: Series = { id: "newer", title: "Newer", slug: "newer" };
const empty: Series = { id: "empty", title: "Empty", slug: "empty" };

// Newest first, as the repository returns them
const posts = [
  makePost("newer-2", "newer"),
  makePost("article"),
  makePost("newer-1", "newer"),
  makePost("older-2", "older"),
  makePost("older-1", "older"),
];

describe("getSeriesWithPosts", () => {
  it("lists posts oldest first", () => {
    const [first] = getSeriesWithPosts(posts, [newer]);

    expect(first!.posts.map((post) => post.slug)).toEqual(["newer-1", "newer-2"]);
  });

  it("puts the series with the newest post first", () => {
    const result = getSeriesWithPosts(posts, [older, newer]);

    expect(result.map((item) => item.series.id)).toEqual(["newer", "older"]);
  });

  it("leaves out series without posts", () => {
    expect(getSeriesWithPosts(posts, [empty])).toEqual([]);
  });
});

describe("getSeriesParts", () => {
  const parts = getSeriesParts(posts, [older, newer, empty]);

  it("numbers posts within their own series", () => {
    expect(parts.get("older-1")).toEqual({ series: older, part: 1 });
    expect(parts.get("older-2")).toEqual({ series: older, part: 2 });
    expect(parts.get("newer-1")).toEqual({ series: newer, part: 1 });
  });

  it("skips posts outside any series", () => {
    expect(parts.has("article")).toBe(false);
  });
});
