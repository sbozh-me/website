import { beforeEach, describe, expect, it, vi } from "vitest";

const getSeries = vi.fn();
const getPosts = vi.fn();

vi.mock("../repository", () => ({
  createBlogRepository: () => ({ getSeries, getPosts }),
}));

import { getPromotedSeries } from "../promoted-series";

const makePost = (slug: string, seriesId?: string) => ({
  id: slug,
  title: slug,
  slug,
  excerpt: "",
  date: "2026-09-24",
  readingTime: 1,
  persona: { id: "1", name: "P", slug: "p", color: "#fff" },
  tags: [],
  seriesId,
});

const series = (id: string, promotion?: string) => ({ id, title: id, slug: id, promotion });

describe("getPromotedSeries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("is empty without touching posts when nothing is promoted", async () => {
    getSeries.mockResolvedValue([series("a")]);

    expect(await getPromotedSeries()).toEqual({});
    expect(getPosts).not.toHaveBeenCalled();
  });

  it("fills each slot with its series and posts in reading order", async () => {
    getSeries.mockResolvedValue([
      series("other"),
      series("pan-dude", "big"),
      series("princeps", "left"),
      series("ludus", "right"),
    ]);
    // Newest first, as the repository returns them
    getPosts.mockResolvedValue([
      makePost("two", "pan-dude"),
      makePost("x", "other"),
      makePost("p1", "princeps"),
      makePost("l1", "ludus"),
      makePost("one", "pan-dude"),
    ]);

    const { big, left, right } = await getPromotedSeries();

    expect(big?.series.slug).toBe("pan-dude");
    expect(big?.posts.map((post) => post.slug)).toEqual(["one", "two"]);
    expect(left?.series.slug).toBe("princeps");
    expect(right?.series.slug).toBe("ludus");
  });

  it("gives a shared slot to the most recently updated series", async () => {
    getSeries.mockResolvedValue([series("old", "big"), series("new", "big")]);
    getPosts.mockResolvedValue([makePost("n1", "new"), makePost("o1", "old")]);

    const slots = await getPromotedSeries();

    expect(slots.big?.series.slug).toBe("new");
    expect(Object.keys(slots)).toEqual(["big"]);
  });

  it("keeps a promoted series with nothing published hidden", async () => {
    getSeries.mockResolvedValue([series("planned", "big")]);
    getPosts.mockResolvedValue([makePost("x")]);

    expect(await getPromotedSeries()).toEqual({});
  });

  it("is empty when Directus fails", async () => {
    getSeries.mockRejectedValue(new Error("down"));

    expect(await getPromotedSeries()).toEqual({});
  });
});
