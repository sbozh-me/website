import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { DirectusRepository, DirectusError } from "../../data/directus-repository";

// Mock data for tests
const mockDirectusPersona = {
  id: "persona-1",
  name: "The Founder",
  slug: "founder",
  color: "#8b5cf6",
  description: "Founder description",
};

const mockDirectusTag = {
  id: "tag-1",
  name: "Tech",
  slug: "tech",
};

const mockDirectusFile = {
  id: "file-1",
  filename_download: "image.png",
  width: 1920,
  height: 1080,
};

const mockDirectusPost = {
  id: "post-1",
  status: "published" as const,
  title: "Test Post",
  slug: "test-post",
  excerpt: "Test excerpt",
  content: "# Test Content",
  date_published: "2025-01-15",
  reading_time: 5,
  persona: mockDirectusPersona,
  tags: [{ tags_id: mockDirectusTag }],
  image: mockDirectusFile,
  attribution: "Test attribution",
};

const mockDirectusPostDraft = {
  ...mockDirectusPost,
  id: "post-2",
  slug: "draft-post",
  status: "draft" as const,
};

const mockDirectusPostNoImage = {
  ...mockDirectusPost,
  id: "post-3",
  slug: "no-image-post",
  image: null,
  attribution: null,
};

// Create mock functions that we can control
const mockRequest = vi.fn();

// Mock the @directus/sdk module
vi.mock("@directus/sdk", () => {
  const mockClient = {
    with: vi.fn().mockReturnThis(),
    request: (...args: unknown[]) => mockRequest(...args),
  };

  return {
    createDirectus: vi.fn(() => mockClient),
    rest: vi.fn(() => "rest-middleware"),
    staticToken: vi.fn((token: string) => `token-middleware:${token}`),
    readItems: vi.fn((collection: string, options?: Record<string, unknown>) => ({
      _type: "readItems",
      collection,
      options,
    })),
  };
});

describe("DirectusRepository", () => {
  let repository: DirectusRepository;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockRequest.mockReset();

    repository = new DirectusRepository({
      url: "http://localhost:8055",
      token: "test-token",
    });
  });

  describe("constructor", () => {
    it("creates client with token when provided", async () => {
      const sdk = await import("@directus/sdk");

      expect(sdk.createDirectus).toHaveBeenCalledWith("http://localhost:8055");
      expect(sdk.staticToken).toHaveBeenCalledWith("test-token");
    });

    it("creates client without token when not provided", async () => {
      vi.clearAllMocks();
      const sdk = await import("@directus/sdk");

      new DirectusRepository({
        url: "http://localhost:8055",
      });

      expect(sdk.staticToken).not.toHaveBeenCalled();
    });
  });

  describe("getPosts", () => {
    it("returns posts mapped to PostListItem", async () => {
      mockRequest.mockResolvedValueOnce([mockDirectusPost]);

      const posts = await repository.getPosts();

      expect(posts).toHaveLength(1);
      expect(posts[0]).toEqual({
        id: "post-1",
        title: "Test Post",
        slug: "test-post",
        excerpt: "Test excerpt",
        date: "2025-01-15",
        readingTime: 5,
        persona: {
          id: "persona-1",
          name: "The Founder",
          slug: "founder",
          color: "#8b5cf6",
          description: "Founder description",
        },
        tags: [{ id: "tag-1", name: "Tech", slug: "tech" }],
        image: {
          src: "http://localhost:8055/assets/file-1",
          alt: "image.png",
          width: 1920,
          height: 1080,
        },
      });
    });

    it("excludes drafts by default", async () => {
      mockRequest.mockResolvedValueOnce([mockDirectusPost]);
      const sdk = await import("@directus/sdk");

      await repository.getPosts();

      expect(sdk.readItems).toHaveBeenCalledWith(
        "posts",
        expect.objectContaining({
          filter: expect.objectContaining({
            status: { _eq: "published" },
          }),
        })
      );
    });

    it("includes drafts when includeDrafts is true", async () => {
      vi.clearAllMocks();
      const draftRepo = new DirectusRepository({
        url: "http://localhost:8055",
        includeDrafts: true,
      });
      mockRequest.mockResolvedValueOnce([mockDirectusPost, mockDirectusPostDraft]);
      const sdk = await import("@directus/sdk");

      await draftRepo.getPosts();

      const calls = (sdk.readItems as Mock).mock.calls;
      const lastCall = calls[calls.length - 1];
      expect(lastCall[1].filter).not.toHaveProperty("status");
    });

    it("filters by persona slug", async () => {
      mockRequest.mockResolvedValueOnce([mockDirectusPost]);
      const sdk = await import("@directus/sdk");

      await repository.getPosts({ persona: "founder" });

      expect(sdk.readItems).toHaveBeenCalledWith(
        "posts",
        expect.objectContaining({
          filter: expect.objectContaining({
            persona: { slug: { _eq: "founder" } },
          }),
        })
      );
    });

    it("filters by tag slug (M2M)", async () => {
      mockRequest.mockResolvedValueOnce([mockDirectusPost]);
      const sdk = await import("@directus/sdk");

      await repository.getPosts({ tag: "tech" });

      expect(sdk.readItems).toHaveBeenCalledWith(
        "posts",
        expect.objectContaining({
          filter: expect.objectContaining({
            tags: { tags_id: { slug: { _eq: "tech" } } },
          }),
        })
      );
    });

    it("filters by year range", async () => {
      mockRequest.mockResolvedValueOnce([mockDirectusPost]);
      const sdk = await import("@directus/sdk");

      await repository.getPosts({ year: 2025 });

      expect(sdk.readItems).toHaveBeenCalledWith(
        "posts",
        expect.objectContaining({
          filter: expect.objectContaining({
            date_published: {
              _gte: "2025-01-01",
              _lt: "2026-01-01",
            },
          }),
        })
      );
    });

    it("combines multiple filters", async () => {
      mockRequest.mockResolvedValueOnce([mockDirectusPost]);
      const sdk = await import("@directus/sdk");

      await repository.getPosts({ persona: "founder", tag: "tech", year: 2025 });

      expect(sdk.readItems).toHaveBeenCalledWith(
        "posts",
        expect.objectContaining({
          filter: expect.objectContaining({
            status: { _eq: "published" },
            persona: { slug: { _eq: "founder" } },
            tags: { tags_id: { slug: { _eq: "tech" } } },
            date_published: { _gte: "2025-01-01", _lt: "2026-01-01" },
          }),
        })
      );
    });

    it("returns empty array when no posts match", async () => {
      mockRequest.mockResolvedValueOnce([]);

      const posts = await repository.getPosts();

      expect(posts).toEqual([]);
    });

    it("handles posts without images", async () => {
      mockRequest.mockResolvedValueOnce([mockDirectusPostNoImage]);

      const posts = await repository.getPosts();

      expect(posts[0].image).toBeUndefined();
    });

    it("handles posts with empty tags", async () => {
      mockRequest.mockResolvedValueOnce([{ ...mockDirectusPost, tags: [] }]);

      const posts = await repository.getPosts();

      expect(posts[0].tags).toEqual([]);
    });

    it("throws DirectusError on API error", async () => {
      const directusError = {
        errors: [{ message: "Forbidden" }],
        response: { status: 403 },
      };
      mockRequest.mockRejectedValue(directusError);

      await expect(repository.getPosts()).rejects.toThrow(DirectusError);

      try {
        await repository.getPosts();
      } catch (e) {
        expect(e).toBeInstanceOf(DirectusError);
        expect((e as DirectusError).message).toBe("Forbidden");
        expect((e as DirectusError).status).toBe(403);
      }
    });

    it("sorts by date_published descending", async () => {
      mockRequest.mockResolvedValueOnce([mockDirectusPost]);
      const sdk = await import("@directus/sdk");

      await repository.getPosts();

      expect(sdk.readItems).toHaveBeenCalledWith(
        "posts",
        expect.objectContaining({
          sort: ["-date_published"],
        })
      );
    });
  });

  describe("getPost", () => {
    it("returns post by slug with full content", async () => {
      mockRequest.mockResolvedValueOnce([mockDirectusPost]);

      const post = await repository.getPost("test-post");

      expect(post).not.toBeNull();
      expect(post?.content).toBe("# Test Content");
      expect(post?.attribution).toBe("Test attribution");
    });

    it("returns null when post not found", async () => {
      mockRequest.mockResolvedValueOnce([]);

      const post = await repository.getPost("non-existent");

      expect(post).toBeNull();
    });

    it("excludes drafts by default", async () => {
      mockRequest.mockResolvedValueOnce([]);
      const sdk = await import("@directus/sdk");

      await repository.getPost("draft-post");

      expect(sdk.readItems).toHaveBeenCalledWith(
        "posts",
        expect.objectContaining({
          filter: expect.objectContaining({
            slug: { _eq: "draft-post" },
            status: { _eq: "published" },
          }),
        })
      );
    });

    it("includes drafts when includeDrafts is true", async () => {
      vi.clearAllMocks();
      const draftRepo = new DirectusRepository({
        url: "http://localhost:8055",
        includeDrafts: true,
      });
      mockRequest.mockResolvedValueOnce([mockDirectusPostDraft]);
      const sdk = await import("@directus/sdk");

      await draftRepo.getPost("draft-post");

      const calls = (sdk.readItems as Mock).mock.calls;
      const lastCall = calls[calls.length - 1];
      expect(lastCall[1].filter).not.toHaveProperty("status");
    });

    it("maps attribution correctly", async () => {
      mockRequest.mockResolvedValueOnce([mockDirectusPost]);

      const post = await repository.getPost("test-post");

      expect(post?.attribution).toBe("Test attribution");
    });

    it("handles null attribution", async () => {
      mockRequest.mockResolvedValueOnce([mockDirectusPostNoImage]);

      const post = await repository.getPost("no-image-post");

      expect(post?.attribution).toBeUndefined();
    });

    it("throws DirectusError on API error", async () => {
      mockRequest.mockRejectedValueOnce(new Error("Network error"));

      await expect(repository.getPost("test-post")).rejects.toThrow(DirectusError);
    });
  });

  describe("getPersonas", () => {
    it("returns all personas", async () => {
      mockRequest.mockResolvedValueOnce([mockDirectusPersona]);

      const personas = await repository.getPersonas();

      expect(personas).toHaveLength(1);
      expect(personas[0]).toEqual({
        id: "persona-1",
        name: "The Founder",
        slug: "founder",
        color: "#8b5cf6",
        description: "Founder description",
      });
    });

    it("handles null description", async () => {
      mockRequest.mockResolvedValueOnce([
        { ...mockDirectusPersona, description: null },
      ]);

      const personas = await repository.getPersonas();

      expect(personas[0].description).toBeUndefined();
    });

    it("throws DirectusError on API error", async () => {
      mockRequest.mockRejectedValueOnce(new Error("Connection refused"));

      await expect(repository.getPersonas()).rejects.toThrow(DirectusError);
    });
  });

  describe("getTags", () => {
    it("returns all tags", async () => {
      mockRequest.mockResolvedValueOnce([mockDirectusTag]);

      const tags = await repository.getTags();

      expect(tags).toHaveLength(1);
      expect(tags[0]).toEqual({
        id: "tag-1",
        name: "Tech",
        slug: "tech",
      });
    });

    it("throws DirectusError on API error", async () => {
      mockRequest.mockRejectedValueOnce(new Error("Timeout"));

      await expect(repository.getTags()).rejects.toThrow(DirectusError);
    });
  });

  describe("image mapping", () => {
    it("generates correct asset URL with default base", async () => {
      mockRequest.mockResolvedValueOnce([mockDirectusPost]);

      const posts = await repository.getPosts();

      expect(posts[0].image?.src).toBe("http://localhost:8055/assets/file-1");
    });

    it("generates correct asset URL with custom base", async () => {
      const customRepo = new DirectusRepository({
        url: "http://localhost:8055",
        assetBaseUrl: "/api/assets",
      });
      mockRequest.mockResolvedValueOnce([mockDirectusPost]);

      const posts = await customRepo.getPosts();

      expect(posts[0].image?.src).toBe("/api/assets/file-1");
    });

    it("maps image dimensions correctly", async () => {
      mockRequest.mockResolvedValueOnce([mockDirectusPost]);

      const posts = await repository.getPosts();

      expect(posts[0].image?.width).toBe(1920);
      expect(posts[0].image?.height).toBe(1080);
    });

    it("uses filename_download as alt text", async () => {
      mockRequest.mockResolvedValueOnce([mockDirectusPost]);

      const posts = await repository.getPosts();

      expect(posts[0].image?.alt).toBe("image.png");
    });
  });
});

describe("DirectusError", () => {
  describe("fromError", () => {
    it("returns same error if already DirectusError", () => {
      const original = new DirectusError("Original", 500);

      const result = DirectusError.fromError(original);

      expect(result).toBe(original);
    });

    it("extracts message from Directus SDK error format", () => {
      const sdkError = {
        errors: [{ message: "You don't have permission" }],
        response: { status: 403 },
      };

      const result = DirectusError.fromError(sdkError);

      expect(result.message).toBe("You don't have permission");
      expect(result.status).toBe(403);
    });

    it("handles multiple errors in array", () => {
      const sdkError = {
        errors: [
          { message: "First error" },
          { message: "Second error" },
        ],
      };

      const result = DirectusError.fromError(sdkError);

      expect(result.message).toBe("First error");
    });

    it("handles empty errors array", () => {
      const sdkError = { errors: [] };

      const result = DirectusError.fromError(sdkError);

      expect(result.message).toBe("Unknown Directus error");
    });

    it("wraps standard Error", () => {
      const error = new Error("Standard error");

      const result = DirectusError.fromError(error);

      expect(result.message).toBe("Standard error");
      expect(result.status).toBeUndefined();
    });

    it("handles unknown error types", () => {
      const result = DirectusError.fromError("string error");

      expect(result.message).toBe("An unexpected error occurred");
    });

    it("handles null", () => {
      const result = DirectusError.fromError(null);

      expect(result.message).toBe("An unexpected error occurred");
    });
  });
});
