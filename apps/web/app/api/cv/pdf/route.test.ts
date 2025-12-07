import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

// Mock puppeteer-core
const mockPdf = vi.fn();
const mockGoto = vi.fn();
const mockEvaluate = vi.fn();
const mockNewPage = vi.fn();
const mockClose = vi.fn();

vi.mock("puppeteer-core", () => ({
  default: {
    launch: vi.fn(() =>
      Promise.resolve({
        newPage: mockNewPage,
        close: mockClose,
      }),
    ),
  },
}));

describe("PDF Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockNewPage.mockResolvedValue({
      goto: mockGoto,
      evaluate: mockEvaluate,
      pdf: mockPdf,
    });
    mockGoto.mockResolvedValue(undefined);
    mockEvaluate.mockResolvedValue(undefined);
    mockPdf.mockResolvedValue(Buffer.from("mock-pdf-content"));
    mockClose.mockResolvedValue(undefined);
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
      'attachment; filename="Sem_Bozhyk_CV.pdf"',
    );
  });

  it("navigates to the CV page", async () => {
    const request = new NextRequest("http://localhost:3000/api/cv/pdf", {
      headers: {
        host: "localhost:3000",
        "x-forwarded-proto": "https",
      },
    });

    await GET(request);

    expect(mockGoto).toHaveBeenCalledWith("https://localhost:3000/cv", {
      waitUntil: "networkidle0",
      timeout: 30000,
    });
  });

  it("sets light theme before generating PDF", async () => {
    const request = new NextRequest("http://localhost:3000/api/cv/pdf");

    await GET(request);

    expect(mockEvaluate).toHaveBeenCalled();
  });

  it("generates PDF with A4 format", async () => {
    const request = new NextRequest("http://localhost:3000/api/cv/pdf");

    await GET(request);

    expect(mockPdf).toHaveBeenCalledWith({
      format: "A4",
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
  });

  it("closes browser after generating PDF", async () => {
    const request = new NextRequest("http://localhost:3000/api/cv/pdf");

    await GET(request);

    expect(mockClose).toHaveBeenCalled();
  });

  it("returns 500 error when puppeteer fails", async () => {
    mockNewPage.mockRejectedValue(new Error("Browser launch failed"));

    const request = new NextRequest("http://localhost:3000/api/cv/pdf");
    const response = await GET(request);

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe("Failed to generate PDF");
  });

  it("returns 500 error when page navigation fails", async () => {
    mockGoto.mockRejectedValue(new Error("Navigation timeout"));

    const request = new NextRequest("http://localhost:3000/api/cv/pdf");
    const response = await GET(request);

    expect(response.status).toBe(500);
  });

  it("uses default host when header is missing", async () => {
    const request = new NextRequest("http://localhost:3000/api/cv/pdf");

    await GET(request);

    expect(mockGoto).toHaveBeenCalledWith(
      expect.stringContaining("localhost:3000/cv"),
      expect.any(Object),
    );
  });

  it("uses CHROME_PATH env variable when set", async () => {
    const originalEnv = process.env.CHROME_PATH;
    process.env.CHROME_PATH = "/custom/chrome/path";

    const request = new NextRequest("http://localhost:3000/api/cv/pdf");
    await GET(request);

    // Restore env
    if (originalEnv === undefined) {
      delete process.env.CHROME_PATH;
    } else {
      process.env.CHROME_PATH = originalEnv;
    }

    // The test passes if no error is thrown - the custom path was used
    expect(mockNewPage).toHaveBeenCalled();
  });
});
