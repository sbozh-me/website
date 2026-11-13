import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { allowPreviewImage, clearPreviewImages } from "@/lib/link-preview-images";
import { safeFetch } from "@/lib/safe-fetch";
import { GET } from "./route";

vi.mock("@/lib/safe-fetch", () => ({ safeFetch: vi.fn() }));

const safeFetchMock = vi.mocked(safeFetch);
const IMAGE = "https://cdn.example.com/og.png";

function request(url: string | null) {
  const requestUrl = new URL("http://localhost:3100/api/link-preview/image");
  if (url !== null) requestUrl.searchParams.set("url", url);
  return new NextRequest(requestUrl);
}

function image({ status = 200, contentType = "image/png", truncated = false } = {}) {
  return { status, url: IMAGE, contentType, body: Buffer.from([1, 2, 3]), truncated };
}

describe("GET /api/link-preview/image", () => {
  beforeEach(() => {
    clearPreviewImages();
    safeFetchMock.mockReset();
  });

  it("serves an allowed image with locked-down headers", async () => {
    allowPreviewImage(IMAGE);
    safeFetchMock.mockResolvedValue(image({ contentType: "image/png; charset=binary" }));

    const response = await GET(request(IMAGE));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("content-security-policy")).toContain("sandbox");
    expect(response.headers.get("cache-control")).toContain("max-age=86400");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
  });

  it("refuses images no preview lookup found, so it isn't an open proxy", async () => {
    const missing = await GET(request(null));
    const unknown = await GET(request(IMAGE));
    expect(missing.status).toBe(404);
    expect(unknown.status).toBe(404);
    expect(safeFetchMock).not.toHaveBeenCalled();
  });

  it("expires allowed images", () => {
    allowPreviewImage(IMAGE, Date.now() - 2 * 60 * 60 * 1000);
    return GET(request(IMAGE)).then((response) => expect(response.status).toBe(404));
  });

  it.each([
    ["SVG", image({ contentType: "image/svg+xml" })],
    ["HTML", image({ contentType: "text/html" })],
    ["an oversized image", image({ truncated: true })],
    ["an error status", image({ status: 404 })],
    ["a blocked fetch", null],
  ])("returns 404 for %s", async (_label, result) => {
    allowPreviewImage(IMAGE);
    safeFetchMock.mockResolvedValue(result);

    const response = await GET(request(IMAGE));
    expect(response.status).toBe(404);
  });

  it("returns 404 when the fetch throws", async () => {
    allowPreviewImage(IMAGE);
    safeFetchMock.mockRejectedValue(new Error("Timed out"));

    const response = await GET(request(IMAGE));
    expect(response.status).toBe(404);
  });
});
