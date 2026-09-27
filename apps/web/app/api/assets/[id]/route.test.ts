import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

const mockFetch = vi.fn();
global.fetch = mockFetch;

function callRoute(headers: Record<string, string> = {}) {
  const request = new NextRequest("http://localhost:3000/api/assets/abc", {
    headers,
  });
  return GET(request, { params: Promise.resolve({ id: "abc" }) });
}

describe("Assets Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("DIRECTUS_URL", "https://directus.example.com");
    vi.stubEnv("DIRECTUS_TOKEN", "secret");

    mockFetch.mockResolvedValue(
      new Response("full-body", {
        status: 200,
        headers: {
          "content-type": "image/png",
          "content-length": "9",
          "accept-ranges": "bytes",
          etag: '"v1"',
        },
      })
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 500 when Directus is not configured", async () => {
    vi.stubEnv("DIRECTUS_URL", "");

    const response = await callRoute();

    expect(response.status).toBe(500);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("proxies the asset with auth and caching headers", async () => {
    const response = await callRoute();

    expect(mockFetch).toHaveBeenCalledWith(
      "https://directus.example.com/assets/abc",
      expect.objectContaining({
        headers: { Authorization: "Bearer secret" },
      })
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/png");
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=31536000, immutable"
    );
    expect(response.headers.get("Accept-Ranges")).toBe("bytes");
    expect(response.headers.get("ETag")).toBe('"v1"');
    expect(await response.text()).toBe("full-body");
  });

  it("omits the Authorization header without a token", async () => {
    vi.stubEnv("DIRECTUS_TOKEN", "");

    await callRoute();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ headers: {} })
    );
  });

  it("forwards range requests and returns 206 partial content", async () => {
    mockFetch.mockResolvedValue(
      new Response("0123", {
        status: 206,
        headers: {
          "content-type": "video/mp4",
          "content-length": "4",
          "content-range": "bytes 0-3/100",
          "accept-ranges": "bytes",
        },
      })
    );

    const response = await callRoute({ range: "bytes=0-3", "if-range": '"v1"' });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: {
          Authorization: "Bearer secret",
          range: "bytes=0-3",
          "if-range": '"v1"',
        },
      })
    );
    expect(response.status).toBe(206);
    expect(response.headers.get("Content-Type")).toBe("video/mp4");
    expect(response.headers.get("Content-Range")).toBe("bytes 0-3/100");
    expect(response.headers.get("Content-Length")).toBe("4");
    expect(await response.text()).toBe("0123");
  });

  it("passes through 416 for unsatisfiable ranges", async () => {
    mockFetch.mockResolvedValue(
      new Response(null, {
        status: 416,
        headers: { "content-range": "bytes */100" },
      })
    );

    const response = await callRoute({ range: "bytes=500-" });

    expect(response.status).toBe(416);
    expect(response.headers.get("Content-Range")).toBe("bytes */100");
  });

  it("returns upstream status when the asset is missing", async () => {
    mockFetch.mockResolvedValue(new Response(null, { status: 404 }));

    const response = await callRoute();

    expect(response.status).toBe(404);
    expect(await response.text()).toBe("Asset not found");
  });

  it("returns 500 when the fetch fails", async () => {
    mockFetch.mockRejectedValue(new Error("network"));

    const response = await callRoute();

    expect(response.status).toBe(500);
    expect(await response.text()).toBe("Failed to fetch asset");
  });
});
