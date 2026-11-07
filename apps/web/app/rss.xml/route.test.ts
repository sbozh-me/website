import { describe, expect, it, vi } from "vitest";

import { GET as blogAtom } from "../(main)/blog/atom.xml/route";
import { GET as blogRss } from "../(main)/blog/rss.xml/route";
import { GET as allAtom } from "../atom.xml/route";
import { GET as releasesAtom } from "../releases/atom.xml/route";
import { GET as releasesRss } from "../releases/rss.xml/route";
import { GET as allRss } from "./route";

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

describe("feed routes", () => {
  it.each([
    ["/rss.xml", allRss, ["post", "release"]],
    ["/blog/rss.xml", blogRss, ["post"]],
    ["/releases/rss.xml", releasesRss, ["release"]],
  ] as const)("RSS %s serves its own entries", async (self, GET, titles) => {
    const xml = await (await GET()).text();

    expect(xml).toContain(`<atom:link href="https://sbozh.me${self}"`);
    expect([...xml.matchAll(/<item><title>([^<]+)/g)].map((m) => m[1])).toEqual(titles);
  });

  it.each([
    ["/atom.xml", allAtom, ["post", "release"]],
    ["/blog/atom.xml", blogAtom, ["post"]],
    ["/releases/atom.xml", releasesAtom, ["release"]],
  ] as const)("Atom %s serves its own entries", async (self, GET, titles) => {
    const xml = await (await GET()).text();

    expect(xml).toContain(`<id>https://sbozh.me${self}</id>`);
    expect([...xml.matchAll(/<entry><title>([^<]+)/g)].map((m) => m[1])).toEqual(titles);
  });
});
