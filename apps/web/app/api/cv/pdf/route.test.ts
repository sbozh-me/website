import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("PDF Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default successful response
    mockFetch.mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("generates PDF and returns it with correct headers", async () => {
    const request = new NextRequest("http://localhost:3000/api/cv/pdf", {
      headers: {
        host: "localhost:3000",
        "x-forwarded-proto": "http",
      },
    });

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="CV_Sem_Bozhyk_Software_Developer.pdf"'
    );
  });

  it("calls PDF service with correct URL", async () => {
    const request = new NextRequest("http://localhost:3000/api/cv/pdf", {
      headers: {
        host: "localhost:3000",
        "x-forwarded-proto": "https",
      },
    });

    await GET(request);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/generate"),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: expect.stringContaining("https://localhost:3000/cv"),
      })
    );
  });

  it("includes filename in request body", async () => {
    const request = new NextRequest("http://localhost:3000/api/cv/pdf");

    await GET(request);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining("CV_Sem_Bozhyk_Software_Developer.pdf"),
      })
    );
  });

  it("returns 500 error when PDF service fails", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      text: () => Promise.resolve("Service error"),
    });

    const request = new NextRequest("http://localhost:3000/api/cv/pdf");
    const response = await GET(request);

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe("Failed to generate PDF");
  });

  it("returns 500 error when fetch throws", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    const request = new NextRequest("http://localhost:3000/api/cv/pdf");
    const response = await GET(request);

    expect(response.status).toBe(500);
  });

  it("uses default host when header is missing", async () => {
    const request = new NextRequest("http://localhost:3000/api/cv/pdf");

    await GET(request);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining("localhost:3000/cv"),
      })
    );
  });

  it("uses PDF_SERVICE_URL env variable when set", async () => {
    const originalEnv = process.env.PDF_SERVICE_URL;
    process.env.PDF_SERVICE_URL = "http://custom-pdf-service:3001";

    // Need to re-import to pick up env change
    vi.resetModules();
    const { GET: freshGET } = await import("./route");

    const request = new NextRequest("http://localhost:3000/api/cv/pdf");
    await freshGET(request);

    expect(mockFetch).toHaveBeenCalledWith(
      "http://custom-pdf-service:3001/generate",
      expect.any(Object)
    );

    // Restore env
    if (originalEnv === undefined) {
      delete process.env.PDF_SERVICE_URL;
    } else {
      process.env.PDF_SERVICE_URL = originalEnv;
    }
  });
});
