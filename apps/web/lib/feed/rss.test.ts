import { beforeEach, describe, expect, it, vi } from "vitest";

import type { FeedChannel } from "./channels";
import type { FeedEntry } from "./entries";
import { feedResponse, renderAtom, renderRss } from "./rss";

const entry: FeedEntry = {
  topic: "blog",
  title: "Rock & <roll>",
  url: "https://sbozh.me/blog/rock-and-roll",
  date: "2026-10-01T10:00:00.000Z",
  description: 'A "loud" post',
};

const channel: FeedChannel = {
  title: "sbozh.me",
  link: "/",
  description: "News",
  rss: "/rss.xml",
  atom: "/atom.xml",
  load: async () => [entry],
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

describe("renderAtom", () => {
  it("renders escaped entries with ids, dates and categories", () => {
    const xml = renderAtom(channel, [entry]);

    expect(xml).toContain('<feed xmlns="http://www.w3.org/2005/Atom">');
    expect(xml).toContain('<link href="https://sbozh.me/atom.xml" rel="self" type="application/atom+xml"/>');
    expect(xml).toContain("<updated>2026-10-01T10:00:00.000Z</updated>");
    expect(xml).toContain("<entry><title>Rock &amp; &lt;roll&gt;</title>");
    expect(xml).toContain("<id>https://sbozh.me/blog/rock-and-roll</id>");
    expect(xml).toContain('<category term="blog" label="Blog posts"/>');
    expect(xml).toContain("<summary>A &quot;loud&quot; post</summary>");
  });

  it("still has an updated date when empty, as Atom requires", () => {
    const xml = renderAtom(channel, []);

    expect(xml).not.toContain("<entry>");
    expect(xml).toContain("<updated>1970-01-01T00:00:00.000Z</updated>");
  });
});

describe("feedResponse", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it.each([
    ["rss", "application/rss+xml"],
    ["atom", "application/atom+xml"],
  ] as const)("serves %s", async (format, type) => {
    const response = await feedResponse(channel, format);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain(type);
  });

  it("returns 503 rather than an empty feed when loading fails", async () => {
    const failing = {
      ...channel,
      load: async () => {
        throw new Error("down");
      },
    };

    expect((await feedResponse(failing, "rss")).status).toBe(503);
  });
});
