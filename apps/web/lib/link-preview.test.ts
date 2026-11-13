import { describe, expect, it } from "vitest";
import { getLinkPreviewPath, parseOpenGraph } from "./link-preview";

const PAGE = "https://sbozh.me/blog/current-post";
const LOCAL_PAGE = "http://localhost:3100/blog/current-post";

describe("getLinkPreviewPath", () => {
  it("returns the path of same-origin links, relative or absolute", () => {
    expect(getLinkPreviewPath("/blog/hello-world", PAGE)).toBe("/blog/hello-world");
    expect(getLinkPreviewPath("https://sbozh.me/projects/tecraft", PAGE)).toBe("/projects/tecraft");
    expect(getLinkPreviewPath("../cv", PAGE)).toBe("/cv");
  });

  it("covers any internal page, not only posts and projects", () => {
    expect(getLinkPreviewPath("/blog/series/my-series", PAGE)).toBe("/blog/series/my-series");
    expect(getLinkPreviewPath("/projects/tecraft/releases/1-0-0", PAGE)).toBe(
      "/projects/tecraft/releases/1-0-0",
    );
    expect(getLinkPreviewPath("/", PAGE)).toBe("/");
  });

  it("keeps the query string and drops the hash", () => {
    expect(getLinkPreviewPath("/blog?view=series#top", PAGE)).toBe("/blog?view=series");
  });

  it("treats absolute production links as internal on other hosts", () => {
    expect(getLinkPreviewPath("https://sbozh.me/blog/hello-world", LOCAL_PAGE)).toBe("/blog/hello-world");
    expect(getLinkPreviewPath("https://www.sbozh.me/projects/tecraft", LOCAL_PAGE)).toBe("/projects/tecraft");
  });

  it("skips external links, subdomains and non-navigational hrefs", () => {
    expect(getLinkPreviewPath("https://example.com/blog/hello-world", PAGE)).toBeNull();
    expect(getLinkPreviewPath("https://ren.sbozh.me/blog/hello-world", PAGE)).toBeNull();
    expect(getLinkPreviewPath("mailto:hi@sbozh.me", PAGE)).toBeNull();
    expect(getLinkPreviewPath("http://[bad", PAGE)).toBeNull();
  });

  it("skips links to the current page, API routes and files", () => {
    expect(getLinkPreviewPath("#section", PAGE)).toBeNull();
    expect(getLinkPreviewPath("/blog/current-post#intro", PAGE)).toBeNull();
    expect(getLinkPreviewPath("/api/og/blog/hello-world", PAGE)).toBeNull();
    expect(getLinkPreviewPath("/blog/rss.xml", PAGE)).toBeNull();
    expect(getLinkPreviewPath("/cv.pdf", PAGE)).toBeNull();
  });

  it("returns null for an unparseable current location", () => {
    expect(getLinkPreviewPath("/blog/x", "not a url")).toBeNull();
  });
});

describe("parseOpenGraph", () => {
  const html = (head: string) => `<html><head>${head}</head><body><meta property="og:image" content="/body.png"></body></html>`;

  it("reads og:image and og:title, making production images root-relative", () => {
    const meta = parseOpenGraph(
      html(
        '<title>How to Pitch | sbozh.me</title><meta property="og:title" content="How to Pitch"/><meta property="og:image" content="https://sbozh.me/api/og/blog/how-to-pitch"/>',
      ),
      "http://127.0.0.1:3000/blog/how-to-pitch",
    );
    expect(meta).toEqual({ image: "/api/og/blog/how-to-pitch", title: "How to Pitch" });
  });

  it("accepts content before property, single quotes and encoded entities", () => {
    const meta = parseOpenGraph(
      html(`<meta content='/img.png?w=1&amp;h=2' property='og:image'><meta name="og:title" content="Tom &amp; Jerry&#39;s &#x2A;">`),
      PAGE,
    );
    expect(meta).toEqual({ image: "/img.png?w=1&h=2", title: "Tom & Jerry's *" });
  });

  it("keeps external images absolute", () => {
    const meta = parseOpenGraph(html('<meta property="og:image" content="https://cdn.example.com/a.png">'), PAGE);
    expect(meta.image).toBe("https://cdn.example.com/a.png");
  });

  it("treats the site-wide default image as no image and falls back to <title>", () => {
    const meta = parseOpenGraph(
      html('<title> Privacy | sbozh.me </title><meta property="og:image" content="https://sbozh.me/ogdefault.png">'),
      PAGE,
    );
    expect(meta).toEqual({ image: null, title: "Privacy | sbozh.me" });
  });

  it("ignores tags outside the head and returns nulls when nothing is set", () => {
    expect(parseOpenGraph(html(""), PAGE)).toEqual({ image: null, title: null });
  });

  it("uses the first value when a tag repeats", () => {
    const meta = parseOpenGraph(
      html('<meta property="og:image" content="/first.png"><meta property="og:image" content="/second.png">'),
      PAGE,
    );
    expect(meta.image).toBe("/first.png");
  });
});
