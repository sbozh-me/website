import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearLinkPreviewCache } from "@/lib/link-preview-cache";
import { GET } from "./route";

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
});
