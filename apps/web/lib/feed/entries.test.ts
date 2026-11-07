import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getAllEntries, getReleaseEntries, releaseTitle, releaseUrl, teaser } from "./entries";

const getPosts = vi.fn();

vi.mock("@/lib/blog/repository", () => ({
  createBlogRepository: () => ({ getPosts }),
}));

const fetchMock = vi.fn();

const release = {
  id: "r1",
  slug: "feeds",
  version: "v1.9.0",
  title: "Feeds",
  summary: "## New Features\n\n- **RSS** for [releases](https://x.y)",
  date_released: "2026-11-02T10:00:00",
  project: { name: "sbozh.me", slug: "sbozh-me" },
};

describe("feed entries", () => {
  beforeEach(() => {
    getPosts.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("DIRECTUS_URL", "http://directus");
    vi.stubEnv("DIRECTUS_TOKEN", "token");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("builds release titles and URLs", () => {
    expect(releaseTitle(release)).toBe("sbozh.me v1.9.0: Feeds");
    expect(releaseTitle({ ...release, project: null, version: "" })).toBe("Feeds");
    expect(releaseUrl(release)).toBe("https://sbozh.me/projects/sbozh-me/releases/feeds");
  });

  it("turns markdown into a short plain teaser", () => {
    expect(teaser(release.summary)).toBe("New Features RSS for releases");
    expect(teaser("a".repeat(300), 10)).toBe("aaaaaaaaa…");
    expect(teaser(null)).toBe("");
  });

  it("fetches only published, already released notes", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ data: [release] }) });

    const [entry] = await getReleaseEntries();

    const url = decodeURIComponent(fetchMock.mock.calls[0][0]);
    expect(url).toContain("filter[status][_eq]=published");
    expect(url).toContain("filter[date_released][_lte]=$NOW");
    expect(entry).toMatchObject({ topic: "releases", title: "sbozh.me v1.9.0: Feeds" });
  });

  it("merges posts and releases newest first", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ data: [release] }) });
    getPosts.mockResolvedValue([
      { title: "Old", slug: "old", excerpt: "", date: "2026-10-01" },
      { title: "New", slug: "new", excerpt: "", date: "2026-11-05" },
    ]);

    const entries = await getAllEntries();

    expect(entries.map((e) => e.title)).toEqual(["New", "sbozh.me v1.9.0: Feeds", "Old"]);
  });
});
