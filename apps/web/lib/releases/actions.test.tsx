import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock MDX evaluation
vi.mock("@mdx-js/mdx", () => ({
  evaluate: vi.fn(async (content) => ({
    default: () => <div data-testid="mdx-content">{content}</div>,
  })),
}));

// Mock repository
const mockGetReleases = vi.fn();
vi.mock("./repository", () => ({
  createReleaseRepository: vi.fn(() => ({
    getReleases: mockGetReleases,
  })),
  DirectusError: class DirectusError extends Error {
    constructor(message: string, public status?: number) {
      super(message);
    }
  },
}));

import { loadMoreReleases } from "./actions";
import { DirectusError } from "./repository";

describe("loadMoreReleases", () => {
  const mockRelease = {
    id: "1",
    slug: "release-1",
    version: "1.0.0",
    title: "Release 1",
    summary: "Test summary",
    dateReleased: "2024-01-01",
    project: { id: "1", name: "Test", slug: "test" },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("successful fetch", () => {
    it("returns releases from repository", async () => {
      mockGetReleases.mockResolvedValue([mockRelease]);

      const result = await loadMoreReleases(0);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.releases).toHaveLength(1);
        expect(result.releases[0]).toEqual(mockRelease);
      }
    });

    it("passes offset and projectSlug to repository", async () => {
      mockGetReleases.mockResolvedValue([]);

      await loadMoreReleases(10, "my-project");

      expect(mockGetReleases).toHaveBeenCalledWith({
        limit: 4, // BATCH_SIZE + 1
        offset: 10,
        project: "my-project",
      });
    });

    it("compiles MDX summaries", async () => {
      mockGetReleases.mockResolvedValue([mockRelease]);

      const result = await loadMoreReleases(0);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.summaries).toHaveProperty("1");
        expect(result.summaries["1"]).toBeDefined();
      }
    });

    it("handles release without summary", async () => {
      mockGetReleases.mockResolvedValue([{ ...mockRelease, summary: undefined }]);

      const result = await loadMoreReleases(0);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.summaries["1"]).toBeNull();
      }
    });
  });

  describe("hasMore calculation", () => {
    it("returns hasMore=true when more releases exist", async () => {
      // Return 4 releases (BATCH_SIZE + 1)
      mockGetReleases.mockResolvedValue([
        mockRelease,
        { ...mockRelease, id: "2" },
        { ...mockRelease, id: "3" },
        { ...mockRelease, id: "4" },
      ]);

      const result = await loadMoreReleases(0);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.hasMore).toBe(true);
        expect(result.releases).toHaveLength(3); // BATCH_SIZE
      }
    });

    it("returns hasMore=false when no more releases", async () => {
      // Return exactly BATCH_SIZE releases
      mockGetReleases.mockResolvedValue([
        mockRelease,
        { ...mockRelease, id: "2" },
        { ...mockRelease, id: "3" },
      ]);

      const result = await loadMoreReleases(0);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.hasMore).toBe(false);
        expect(result.releases).toHaveLength(3);
      }
    });

    it("returns hasMore=false when fewer than BATCH_SIZE releases", async () => {
      mockGetReleases.mockResolvedValue([mockRelease]);

      const result = await loadMoreReleases(0);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.hasMore).toBe(false);
        expect(result.releases).toHaveLength(1);
      }
    });

    it("slices extra release when hasMore is true", async () => {
      mockGetReleases.mockResolvedValue([
        { ...mockRelease, id: "1" },
        { ...mockRelease, id: "2" },
        { ...mockRelease, id: "3" },
        { ...mockRelease, id: "4" }, // This should be sliced off
      ]);

      const result = await loadMoreReleases(0);

      expect(result.success).toBe(true);
      if (result.success) {
        const releaseIds = result.releases.map((r) => r.id);
        expect(releaseIds).toEqual(["1", "2", "3"]);
        expect(releaseIds).not.toContain("4");
      }
    });
  });

  describe("error handling", () => {
    it("returns error on DirectusError", async () => {
      mockGetReleases.mockRejectedValue(new DirectusError("API error", 500));

      const result = await loadMoreReleases(0);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("API error");
      }
    });

    it("returns generic error on unknown error", async () => {
      mockGetReleases.mockRejectedValue(new Error("Unknown error"));

      const result = await loadMoreReleases(0);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unable to load releases");
      }
    });
  });

  describe("empty repository", () => {
    it("returns empty result when no releases", async () => {
      mockGetReleases.mockResolvedValue([]);

      const result = await loadMoreReleases(0);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.releases).toHaveLength(0);
        expect(result.summaries).toEqual({});
        expect(result.hasMore).toBe(false);
      }
    });
  });

  describe("repository unavailable", () => {
    it("returns empty result when repository is null", async () => {
      const { createReleaseRepository } = await import("./repository");
      vi.mocked(createReleaseRepository).mockReturnValueOnce(null as any);

      const result = await loadMoreReleases(0);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.releases).toHaveLength(0);
        expect(result.summaries).toEqual({});
        expect(result.hasMore).toBe(false);
      }
    });
  });
});
