import { describe, expect, it } from "vitest";
import { getLinkPreviewQuery, parseOpenGraph } from "./link-preview";

const PAGE = "https://sbozh.me/blog/current-post";
const LOCAL_PAGE = "http://localhost:3100/blog/current-post";

// Decodes the query so expectations read as plain paths and URLs
function target(href: string, page = PAGE) {
  const query = getLinkPreviewQuery(href, page);
  return query === null ? null : Object.fromEntries(new URLSearchParams(query));
}

describe("getLinkPreviewQuery", () => {
  it("returns the path of same-origin links, relative or absolute", () => {
    expect(target("/blog/hello-world")).toEqual({ path: "/blog/hello-world" });
    expect(target("https://sbozh.me/projects/tecraft")).toEqual({ path: "/projects/tecraft" });
    expect(target("../cv")).toEqual({ path: "/cv" });
  });

  it("covers any internal page, not only posts and projects", () => {
    expect(target("/blog/series/my-series")).toEqual({ path: "/blog/series/my-series" });
    expect(target("/projects/tecraft/releases/1-0-0")).toEqual({ path: "/projects/tecraft/releases/1-0-0" });
    expect(target("/")).toEqual({ path: "/" });
  });

  it("keeps the query string and drops the hash", () => {
    expect(target("/blog?view=series#top")).toEqual({ path: "/blog?view=series" });
    expect(getLinkPreviewQuery("/blog?view=series", PAGE)).toBe("path=%2Fblog%3Fview%3Dseries");
  });

  it("treats absolute production links as internal on other hosts", () => {
    expect(target("https://sbozh.me/blog/hello-world", LOCAL_PAGE)).toEqual({ path: "/blog/hello-world" });
    expect(target("https://www.sbozh.me/projects/tecraft", LOCAL_PAGE)).toEqual({ path: "/projects/tecraft" });
  });

  it("returns the full URL of external http(s) links, without the hash", () => {
    expect(target("https://example.com/blog/hello-world?a=1#part")).toEqual({
      url: "https://example.com/blog/hello-world?a=1",
    });
    expect(target("http://example.com")).toEqual({ url: "http://example.com/" });
    expect(target("https://ren.sbozh.me/blog/x")).toEqual({ url: "https://ren.sbozh.me/blog/x" });
  });

  it("skips non-web links", () => {
    expect(target("mailto:hi@sbozh.me")).toBeNull();
    expect(target("tel:+420123")).toBeNull();
    expect(target("javascript:alert(1)")).toBeNull();
    expect(target("ftp://example.com/file")).toBeNull();
    expect(target("http://[bad")).toBeNull();
  });

  it("skips links to the current page, API routes and files", () => {
    expect(target("#section")).toBeNull();
    expect(target("/blog/current-post#intro")).toBeNull();
    expect(target("/api/og/blog/hello-world")).toBeNull();
    expect(target("/blog/rss.xml")).toBeNull();
    expect(target("/cv.pdf")).toBeNull();
  });

  it("returns null for an unparseable current location", () => {
    expect(getLinkPreviewQuery("/blog/x", "not a url")).toBeNull();
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

  it("keeps images of external pages absolute, even from the page's own host", () => {
    const meta = parseOpenGraph(
      html('<meta property="og:image" content="/og.png"><meta name="twitter:image" content="/tw.png">'),
      "https://example.com/post",
    );
    expect(meta.image).toBe("https://example.com/og.png");
  });

  it("makes same-host images root-relative for internal pages", () => {
    const meta = parseOpenGraph(
      html('<meta property="og:image" content="http://127.0.0.1:3000/og.png">'),
      "http://127.0.0.1:3000/cv",
      { internal: true },
    );
    expect(meta.image).toBe("/og.png");
  });

  it("falls back to twitter:image", () => {
    const meta = parseOpenGraph(html('<meta name="twitter:image" content="https://cdn.example.com/tw.png">'), PAGE);
    expect(meta.image).toBe("https://cdn.example.com/tw.png");
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
