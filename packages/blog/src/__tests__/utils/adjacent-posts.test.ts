import { describe, expect, it } from "vitest";

import { getAdjacentPosts, thumbnailSrc } from "../../utils/adjacent-posts";
import type { PostListItem, Series } from "../../types";

function makePost(slug: string): PostListItem {
  return {
    id: slug,
    title: slug,
    slug,
    excerpt: "",
    date: "2026-01-01",
    readingTime: 1,
    persona: { id: "1", name: "P", slug: "p", color: "#fff" },
    tags: [],
  };
}

// Newest first, as the repository returns them
const posts = [makePost("newest"), makePost("middle"), makePost("oldest")];

describe("getAdjacentPosts", () => {
  it("returns older post as previous and newer post as next", () => {
    const { previous, next } = getAdjacentPosts(posts, "middle");

    expect(previous?.slug).toBe("oldest");
    expect(next?.slug).toBe("newest");
  });

  it("has no next post for the newest post", () => {
    const { previous, next } = getAdjacentPosts(posts, "newest");

    expect(previous?.slug).toBe("middle");
    expect(next).toBeNull();
  });

  it("has no previous post for the oldest post", () => {
    const { previous, next } = getAdjacentPosts(posts, "oldest");

    expect(previous).toBeNull();
    expect(next?.slug).toBe("middle");
  });

  it("returns nothing when the post is not in the list", () => {
    expect(getAdjacentPosts(posts, "draft")).toEqual({ previous: null, next: null });
  });

  describe("with an editor-picked next post", () => {
    // "oldest" skips "middle" and points straight at "newest"
    const picked = [
      makePost("newest"),
      makePost("middle"),
      { ...makePost("oldest"), nextPostId: "newest" },
    ];

    it("uses the picked post as next", () => {
      expect(getAdjacentPosts(picked, "oldest").next?.slug).toBe("newest");
    });

    it("links the picked post back as previous", () => {
      expect(getAdjacentPosts(picked, "newest").previous?.slug).toBe("oldest");
    });

    it("leaves unrelated posts chronological", () => {
      const { previous, next } = getAdjacentPosts(picked, "middle");

      expect(previous?.slug).toBe("oldest");
      expect(next?.slug).toBe("newest");
    });

    it("falls back to chronology when the pick is not published", () => {
      const list = [makePost("newest"), { ...makePost("middle"), nextPostId: "draft" }];

      expect(getAdjacentPosts(list, "middle").next?.slug).toBe("newest");
    });

    it("ignores a post picking itself", () => {
      const list = [makePost("newest"), { ...makePost("middle"), nextPostId: "middle" }];

      const { previous, next } = getAdjacentPosts(list, "middle");
      expect(next?.slug).toBe("newest");
      expect(previous).toBeNull();
    });
  });

  describe("with a series", () => {
    const inSeries = (slug: string): PostListItem => ({ ...makePost(slug), seriesId: "standups" });
    // Series posts interleaved with regular ones, newest first
    const mixed = [
      inSeries("standup-3"),
      makePost("article-2"),
      inSeries("standup-2"),
      makePost("article-1"),
      inSeries("standup-1"),
    ];

    it("moves between posts of the same series", () => {
      const { previous, next } = getAdjacentPosts(mixed, "standup-2");

      expect(previous?.slug).toBe("standup-1");
      expect(next?.slug).toBe("standup-3");
    });

    it("stops at the ends of the series", () => {
      expect(getAdjacentPosts(mixed, "standup-1").previous).toBeNull();
      expect(getAdjacentPosts(mixed, "standup-3").next).toBeNull();
    });

    it("skips series posts when navigating regular posts", () => {
      expect(getAdjacentPosts(mixed, "article-1").next?.slug).toBe("article-2");
      expect(getAdjacentPosts(mixed, "article-2").previous?.slug).toBe("article-1");
    });

    it("keeps separate series apart", () => {
      const list = [inSeries("standup-2"), { ...makePost("other"), seriesId: "other" }, inSeries("standup-1")];

      expect(getAdjacentPosts(list, "standup-1").next?.slug).toBe("standup-2");
      expect(getAdjacentPosts(list, "other")).toEqual({ previous: null, next: null });
    });

    it("honours a pick inside the series", () => {
      const list = [
        inSeries("standup-3"),
        inSeries("standup-2"),
        { ...inSeries("standup-1"), nextPostId: "standup-3" },
      ];

      expect(getAdjacentPosts(list, "standup-1").next?.slug).toBe("standup-3");
      expect(getAdjacentPosts(list, "standup-3").previous?.slug).toBe("standup-1");
    });

    it("ignores a pick crossing the series boundary", () => {
      const list = [
        makePost("article"),
        inSeries("standup-2"),
        { ...inSeries("standup-1"), nextPostId: "article" },
      ];

      expect(getAdjacentPosts(list, "standup-1").next?.slug).toBe("standup-2");
      expect(getAdjacentPosts(list, "article").previous).toBeNull();
    });
  });

  describe("with a linked series", () => {
    const inPart = (slug: string, seriesId: string): PostListItem => ({ ...makePost(slug), seriesId });
    const part1: Series = { id: "part-1", title: "Part 1", slug: "part-1", nextSeriesId: "part-2" };
    const part2: Series = { id: "part-2", title: "Part 2", slug: "part-2" };
    const list = [
      inPart("two-b", "part-2"),
      makePost("article"),
      inPart("two-a", "part-2"),
      inPart("one-b", "part-1"),
      inPart("one-a", "part-1"),
    ];

    it("leads from the last post to the first post of the next series", () => {
      const { next, nextIsSeries } = getAdjacentPosts(list, "one-b", [part1, part2]);

      expect(next?.slug).toBe("two-a");
      expect(nextIsSeries).toBe(true);
    });

    it("leads back from the first post to the last post of the earlier series", () => {
      const { previous, previousIsSeries } = getAdjacentPosts(list, "two-a", [part1, part2]);

      expect(previous?.slug).toBe("one-b");
      expect(previousIsSeries).toBe(true);
    });

    it("stays inside the series away from its ends", () => {
      const result = getAdjacentPosts(list, "one-a", [part1, part2]);

      expect(result.next?.slug).toBe("one-b");
      expect(result.nextIsSeries).toBeUndefined();
      expect(result.previous).toBeNull();
    });

    it("has no next post at the end of the last series", () => {
      expect(getAdjacentPosts(list, "two-b", [part1, part2]).next).toBeNull();
    });

    it("ignores a linked series without published posts", () => {
      const unpublished = { ...part1, nextSeriesId: "draft-series" };

      expect(getAdjacentPosts(list, "one-b", [unpublished, part2]).next).toBeNull();
    });

    it("ignores a series linked to itself", () => {
      const self = { ...part1, nextSeriesId: "part-1" };
      const { previous, next } = getAdjacentPosts(list, "one-b", [self]);

      expect(next).toBeNull();
      expect(previous?.slug).toBe("one-a");
      expect(getAdjacentPosts(list, "one-a", [self]).previous).toBeNull();
    });

    it("leaves regular posts alone", () => {
      expect(getAdjacentPosts(list, "article", [part1, part2])).toEqual({ previous: null, next: null });
    });
  });
});

describe("thumbnailSrc", () => {
  it("adds a width to proxied Directus assets", () => {
    expect(thumbnailSrc("/api/assets/abc", 640)).toBe("/api/assets/abc?w=640");
  });

  it("leaves other sources untouched", () => {
    expect(thumbnailSrc("/trireme-ship.png", 640)).toBe("/trireme-ship.png");
  });
});
