import { beforeEach, describe, expect, it, vi } from "vitest";

import type { FeedEntry } from "./entries";
import { feedResponse, renderRss } from "./rss";

const channel = { title: "sbozh.me", link: "/", description: "News", self: "/rss.xml" };

const entry: FeedEntry = {
  topic: "blog",
  title: "Rock & <roll>",
  url: "https://sbozh.me/blog/rock-and-roll",
  date: "2026-10-01T10:00:00.000Z",
  description: 'A "loud" post',
};

describe("renderRss", () => {
  it("renders escaped entries with their topic as category", () => {
    const xml = renderRss(channel, [entry]);

    expect(xml).toContain("<title>Rock &amp; &lt;roll&gt;</title>");
    expect(xml).toContain("<description>A &quot;loud&quot; post</description>");
    expect(xml).toContain("<link>https://sbozh.me/blog/rock-and-roll</link>");
    expect(xml).toContain("<pubDate>Thu, 01 Oct 2026 10:00:00 GMT</pubDate>");
    expect(xml).toContain("<category>Blog posts</category>");
    expect(xml).toContain('<atom:link href="https://sbozh.me/rss.xml" rel="self"');
  });

  it("strips control characters that are illegal in XML", () => {
    expect(renderRss(channel, [{ ...entry, title: "a\u0001b" }])).toContain("<title>ab</title>");
  });

  it("renders a valid empty channel", () => {
    const xml = renderRss(channel, []);

    expect(xml).not.toContain("<item>");
    expect(xml).not.toContain("lastBuildDate");
  });
});

describe("feedResponse", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("serves RSS", async () => {
    const response = await feedResponse(channel, async () => [entry]);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("application/rss+xml");
  });

  it("returns 503 rather than an empty feed when loading fails", async () => {
    const response = await feedResponse(channel, async () => {
      throw new Error("down");
    });

    expect(response.status).toBe(503);
  });
});
