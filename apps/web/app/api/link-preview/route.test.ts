import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isPreviewImageAllowed } from "@/lib/link-preview-images";
import { safeFetch } from "@/lib/safe-fetch";
import { clearLinkPreviewCache } from "@/lib/link-preview-cache";
import { GET } from "./route";

vi.mock("@/lib/safe-fetch", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/safe-fetch")>()),
  safeFetch: vi.fn(),
}));

const safeFetchMock = vi.mocked(safeFetch);

function externalRequest(url: string) {
  const requestUrl = new URL("http://localhost:3100/api/link-preview");
  requestUrl.searchParams.set("url", url);
  return new NextRequest(requestUrl);
}

function externalPage(
  html: string,
  { status = 200, url = "https://example.com/post", contentType = "text/html; charset=utf-8" } = {},
) {
  return { status, url, contentType, body: Buffer.from(html), truncated: false };
}

function request(path: string | null) {
  const url = new URL("http://localhost:3100/api/link-preview");
  if (path !== null) url.searchParams.set("path", path);
  return new NextRequest(url);
}

function page(html: string, { status = 200, url = "http://localhost:3100/blog/x", type = "text/html; charset=utf-8" } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    url,
    headers: new Headers({ "content-type": type }),
    text: () => Promise.resolve(html),
  };
}

const HEAD = '<head><meta property="og:title" content="X"/><meta property="og:image" content="https://sbozh.me/api/og/blog/x"/></head>';

describe("GET /api/link-preview", () => {
  beforeEach(() => {
    clearLinkPreviewCache();
    safeFetchMock.mockReset();
    vi.stubEnv("PORT", "");
    delete process.env.PORT;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("returns the page's OG image and title", async () => {
    const fetchMock = vi.fn().mockResolvedValue(page(HEAD));
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(request("/blog/x"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ image: "/api/og/blog/x", title: "X" });
    expect(String(fetchMock.mock.calls[0][0])).toBe("http://localhost:3100/blog/x");
    // Crawler UA so Next renders metadata in <head> instead of streaming it into <body>
    expect(fetchMock.mock.calls[0][1].headers["user-agent"]).toContain("facebookexternalhit");
  });

  it("fetches from the app port when PORT is set", async () => {
    vi.stubEnv("PORT", "3000");
    const fetchMock = vi.fn().mockResolvedValue(page(HEAD, { url: "http://127.0.0.1:3000/blog/x" }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(request("/blog/x"));
    expect(response.status).toBe(200);
    expect(String(fetchMock.mock.calls[0][0])).toBe("http://127.0.0.1:3000/blog/x");
  });

  it("caches results per path", async () => {
    const fetchMock = vi.fn().mockResolvedValue(page(HEAD));
    vi.stubGlobal("fetch", fetchMock);

    await GET(request("/blog/x"));
    const second = await GET(request("/blog/x"));
    expect(await second.json()).toEqual({ image: "/api/og/blog/x", title: "X" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([null, "", "blog/x", "//evil.com/x", "/api/og/blog/x"])("rejects path %j", async (path) => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(request(path));
    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 404 for missing pages, non-HTML responses, off-site redirects and fetch errors", async () => {
    const cases = [
      vi.fn().mockResolvedValue(page("", { status: 404 })),
      vi.fn().mockResolvedValue(page("{}", { type: "application/json" })),
      vi.fn().mockResolvedValue(page(HEAD, { url: "https://example.com/x" })),
      vi.fn().mockRejectedValue(new Error("timeout")),
    ];

    for (const [i, fetchMock] of cases.entries()) {
      vi.stubGlobal("fetch", fetchMock);
      const response = await GET(request(`/case-${i}`));
      expect(response.status).toBe(404);
    }
  });

  describe("external links", () => {
    it("returns the OG title and a proxied image, allowing that image in the proxy", async () => {
      safeFetchMock.mockResolvedValue(
        externalPage(
          '<head><meta property="og:title" content="Post"><meta property="og:image" content="/og.png"></head>',
        ),
      );

      const response = await GET(externalRequest("https://example.com/post#intro"));
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        image: "/api/link-preview/image?url=https%3A%2F%2Fexample.com%2Fog.png",
        title: "Post",
      });
      expect(safeFetchMock.mock.calls[0][0]).toBe("https://example.com/post");
      expect(isPreviewImageAllowed("https://example.com/og.png")).toBe(true);
    });

    it("falls back to the hostname without a title, and drops images on private hosts", async () => {
      safeFetchMock.mockResolvedValue(
        externalPage('<head><meta property="og:image" content="http://127.0.0.1/secret.png"></head>', {
          url: "https://example.com/redirected",
        }),
      );

      const response = await GET(externalRequest("https://example.com/post"));
      expect(await response.json()).toEqual({ image: null, title: "example.com" });
      expect(isPreviewImageAllowed("http://127.0.0.1/secret.png")).toBe(false);
    });

    it("keeps images on sbozh.me root-relative", async () => {
      safeFetchMock.mockResolvedValue(
        externalPage('<head><meta property="og:image" content="https://sbozh.me/api/og/blog/x"></head>'),
      );

      const response = await GET(externalRequest("https://example.com/post"));
      expect((await response.json()).image).toBe("/api/og/blog/x");
    });

    it("decodes the page in its declared charset", async () => {
      safeFetchMock.mockResolvedValue({
        ...externalPage(""),
        contentType: "text/html; charset=windows-1251",
        body: Buffer.from([0x3c, 0x74, 0x69, 0x74, 0x6c, 0x65, 0x3e, 0xcf, 0xf0, 0xe8, 0x3c, 0x2f, 0x74, 0x69, 0x74, 0x6c, 0x65, 0x3e]),
      });

      const response = await GET(externalRequest("https://example.com/post"));
      expect((await response.json()).title).toBe("При");
    });

    it.each([
      "http://127.0.0.1:8055/",
      "http://localhost/",
      "http://169.254.169.254/latest/meta-data/",
      "http://[::1]/",
      "http://user:pass@example.com/",
      "https://example.com:8443/",
      "file:///etc/passwd",
      "https://sbozh.me/blog/x",
      "not a url",
    ])("rejects %s without fetching it", async (url) => {
      const response = await GET(externalRequest(url));
      expect(response.status).toBe(400);
      expect(safeFetchMock).not.toHaveBeenCalled();
    });

    it("returns 404 for blocked or failed fetches, error statuses and non-HTML", async () => {
      const cases = [
        () => safeFetchMock.mockResolvedValue(null),
        () => safeFetchMock.mockRejectedValue(new Error("EBLOCKED")),
        () => safeFetchMock.mockResolvedValue(externalPage("", { status: 500 })),
        () => safeFetchMock.mockResolvedValue(externalPage("%PDF", { contentType: "application/pdf" })),
      ];

      for (const [i, arrange] of cases.entries()) {
        arrange();
        const response = await GET(externalRequest(`https://example.com/case-${i}`));
        expect(response.status).toBe(404);
      }
    });

    it("caches external results", async () => {
      safeFetchMock.mockResolvedValue(externalPage("<head><title>Once</title></head>"));

      await GET(externalRequest("https://example.com/once"));
      const second = await GET(externalRequest("https://example.com/once"));
      expect((await second.json()).title).toBe("Once");
      expect(safeFetchMock).toHaveBeenCalledTimes(1);
    });
  });
});
