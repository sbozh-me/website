import { describe, expect, it } from "vitest";

import { groupPostsByDate } from "../../utils/date-grouping";

import type { PostListItem } from "../../types/post";

const createPost = (
  id: string,
  date: string,
  overrides: Partial<PostListItem> = {},
): PostListItem => ({
  id,
  title: `Post ${id}`,
  slug: `post-${id}`,
  excerpt: `Excerpt for post ${id}`,
  date,
  readingTime: 5,
  persona: { id: "1", slug: "dev", name: "Dev", color: "#3b82f6" },
  tags: [],
  ...overrides,
});

describe("groupPostsByDate", () => {
  it("returns empty array for empty input", () => {
    expect(groupPostsByDate([])).toEqual([]);
  });

  it("groups single post correctly", () => {
    const posts = [createPost("1", "2024-03-15")];
    const result = groupPostsByDate(posts);

    expect(result).toHaveLength(1);
    expect(result[0].year).toBe(2024);
    expect(result[0].months).toHaveLength(1);
    expect(result[0].months[0].month).toBe("March");
    expect(result[0].months[0].posts).toHaveLength(1);
  });

  it("groups posts by year in descending order", () => {
    const posts = [
      createPost("1", "2023-06-01"),
      createPost("2", "2024-06-01"),
      createPost("3", "2022-06-01"),
    ];
    const result = groupPostsByDate(posts);

    expect(result).toHaveLength(3);
    expect(result[0].year).toBe(2024);
    expect(result[1].year).toBe(2023);
    expect(result[2].year).toBe(2022);
  });

  it("groups posts by month within year in descending order", () => {
    const posts = [
      createPost("1", "2024-01-15"),
      createPost("2", "2024-06-15"),
      createPost("3", "2024-12-15"),
    ];
    const result = groupPostsByDate(posts);

    expect(result).toHaveLength(1);
    expect(result[0].year).toBe(2024);
    expect(result[0].months).toHaveLength(3);
    expect(result[0].months[0].month).toBe("December");
    expect(result[0].months[1].month).toBe("June");
    expect(result[0].months[2].month).toBe("January");
  });

  it("sorts posts within month by date (newest first)", () => {
    const posts = [
      createPost("1", "2024-06-01"),
      createPost("2", "2024-06-15"),
      createPost("3", "2024-06-30"),
    ];
    const result = groupPostsByDate(posts);

    expect(result[0].months[0].posts[0].id).toBe("3");
    expect(result[0].months[0].posts[1].id).toBe("2");
    expect(result[0].months[0].posts[2].id).toBe("1");
  });

  it("handles all 12 months correctly", () => {
    const posts = [
      createPost("1", "2024-01-15"),
      createPost("2", "2024-02-15"),
      createPost("3", "2024-03-15"),
      createPost("4", "2024-04-15"),
      createPost("5", "2024-05-15"),
      createPost("6", "2024-06-15"),
      createPost("7", "2024-07-15"),
      createPost("8", "2024-08-15"),
      createPost("9", "2024-09-15"),
      createPost("10", "2024-10-15"),
      createPost("11", "2024-11-15"),
      createPost("12", "2024-12-15"),
    ];
    const result = groupPostsByDate(posts);

    const monthNames = result[0].months.map((m) => m.month);
    expect(monthNames).toEqual([
      "December",
      "November",
      "October",
      "September",
      "August",
      "July",
      "June",
      "May",
      "April",
      "March",
      "February",
      "January",
    ]);
  });

  it("preserves post data in grouped result", () => {
    const posts = [
      createPost("1", "2024-06-15", {
        title: "Custom Title",
        excerpt: "Custom excerpt",
        readingTime: 10,
      }),
    ];
    const result = groupPostsByDate(posts);

    const post = result[0].months[0].posts[0];
    expect(post.title).toBe("Custom Title");
    expect(post.excerpt).toBe("Custom excerpt");
    expect(post.readingTime).toBe(10);
  });
});
