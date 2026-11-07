import { describe, expect, it, vi } from "vitest";

import { GET as blogFeed } from "../(main)/blog/rss.xml/route";
import { GET as releasesFeed } from "../releases/rss.xml/route";
import { GET as allFeed } from "./route";

const entry = (topic: string, title: string) => ({
  topic,
  title,
  url: `https://sbozh.me/${title}`,
  date: "2026-11-01T00:00:00Z",
  description: "",
});

vi.mock("@/lib/feed/entries", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/feed/entries")>()),
  getAllEntries: async () => [entry("blog", "post"), entry("releases", "release")],
  getBlogEntries: async () => [entry("blog", "post")],
  getReleaseEntries: async () => [entry("releases", "release")],
}));

describe("RSS feeds", () => {
  it.each([
    ["/rss.xml", allFeed, ["post", "release"]],
    ["/blog/rss.xml", blogFeed, ["post"]],
    ["/releases/rss.xml", releasesFeed, ["release"]],
  ] as const)("%s serves its own entries", async (self, GET, titles) => {
    const xml = await (await GET()).text();

    expect(xml).toContain(`<atom:link href="https://sbozh.me${self}"`);
    expect([...xml.matchAll(/<item><title>([^<]+)/g)].map((m) => m[1])).toEqual(titles);
  });
});
