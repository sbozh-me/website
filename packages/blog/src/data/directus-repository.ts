import {
  createDirectus,
  rest,
  readItems,
  staticToken,
  type RestClient,
} from "@directus/sdk";
import type { BlogRepository } from "./repository";
import type { PostFilters } from "../types/filters";
import type { Persona } from "../types/persona";
import type { Post, PostListItem } from "../types/post";
import type { Tag } from "../types/tag";

export class DirectusError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = "DirectusError";
  }

  static fromError(error: unknown): DirectusError {
    if (error instanceof DirectusError) {
      return error;
    }

    // Handle Directus SDK errors
    if (
      error &&
      typeof error === "object" &&
      "errors" in error &&
      Array.isArray((error as { errors: unknown[] }).errors)
    ) {
      const directusErrors = (error as { errors: { message: string }[] })
        .errors;
      const message =
        directusErrors[0]?.message || "Unknown Directus error";

      // Extract status from response if available
      let status: number | undefined;
      if ("response" in error && error.response) {
        const response = error.response as { status?: number };
        status = response.status;
      }

      return new DirectusError(message, status);
    }

    if (error instanceof Error) {
      return new DirectusError(error.message);
    }

    return new DirectusError("An unexpected error occurred");
  }
}

// Directus collection types
interface DirectusPost {
  id: string;
  status: "published" | "draft";
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  date_published: string;
  reading_time: number;
  persona: DirectusPersona;
  tags: { tags_id: DirectusTag }[];
  image: DirectusFile | null;
  attribution: string | null;
}

interface DirectusPersona {
  id: string;
  name: string;
  slug: string;
  color: string;
  description: string | null;
}

interface DirectusTag {
  id: string;
  name: string;
  slug: string;
}

interface DirectusFile {
  id: string;
  filename_download: string;
  width: number;
  height: number;
}

interface DirectusSchema {
  posts: DirectusPost[];
  personas: DirectusPersona[];
  tags: DirectusTag[];
  posts_tags: { id: number; posts_id: string; tags_id: string }[];
}

export interface DirectusConfig {
  url: string;
  token?: string;
  includeDrafts?: boolean;
  /** Base URL for assets. Defaults to `${url}/assets`. Use `/api/assets` for Next.js proxy. */
  assetBaseUrl?: string;
  /** Enable debug logging for API requests */
  debug?: boolean;
}

export class DirectusRepository implements BlogRepository {
  private client: RestClient<DirectusSchema>;
  private assetBaseUrl: string;
  private includeDrafts: boolean;
  private debug: boolean;

  constructor(config: DirectusConfig) {
    this.assetBaseUrl = config.assetBaseUrl ?? `${config.url}/assets`;
    this.includeDrafts = config.includeDrafts ?? false;
    this.debug = config.debug ?? false;

    // Disable Next.js fetch caching for all Directus requests
    const client = createDirectus<DirectusSchema>(config.url).with(
      rest({
        onRequest: (options) => ({
          ...options,
          cache: "no-store",
        }),
      })
    );
    if (config.token) {
      this.client = client.with(staticToken(config.token));
    } else {
      this.client = client;
    }
  }

  private log(method: string, message: string, data?: unknown): void {
    if (this.debug) {
      const prefix = `[DirectusRepository.${method}]`;
      if (data !== undefined) {
        console.log(prefix, message, JSON.stringify(data, null, 2));
      } else {
        console.log(prefix, message);
      }
    }
  }

  async getPosts(filters?: PostFilters): Promise<PostListItem[]> {
    try {
      const directusFilter = this.buildFilter(filters);
      this.log("getPosts", "Fetching posts with filter:", directusFilter);

      const posts = await this.client.request(
        readItems("posts", {
          filter: directusFilter,
          // Directus SDK types don't properly infer junction table fields (tags)
          fields: [
            "id",
            "status",
            "title",
            "slug",
            "excerpt",
            "date_published",
            "reading_time",
            { persona: ["id", "name", "slug", "color", "description"] },
            { tags: [{ tags_id: ["id", "name", "slug"] }] },
            { image: ["id", "filename_download", "width", "height"] },
          ] as unknown as (keyof DirectusPost)[],
          sort: ["-date_published"],
        })
      );

      this.log("getPosts", `Fetched ${posts.length} posts`);
      return (posts as DirectusPost[]).map(this.mapToPostListItem.bind(this));
    } catch (error) {
      this.log("getPosts", "Error:", error);
      throw DirectusError.fromError(error);
    }
  }

  async getPost(slug: string): Promise<Post | null> {
    try {
      const filter: Record<string, unknown> = { slug: { _eq: slug } };
      if (!this.includeDrafts) {
        filter.status = { _eq: "published" };
      }
      this.log("getPost", `Fetching post with slug "${slug}"`, filter);

      const posts = await this.client.request(
        readItems("posts", {
          filter,
          // Directus SDK types don't properly infer junction table fields (tags)
          fields: [
            "*",
            { persona: ["*"] },
            { tags: [{ tags_id: ["*"] }] },
            { image: ["*"] },
          ] as unknown as (keyof DirectusPost)[],
          limit: 1,
        })
      );

      if (posts.length === 0) {
        this.log("getPost", `Post not found: "${slug}"`);
        return null;
      }
      this.log("getPost", `Found post: "${posts[0].title}"`);
      return this.mapToPost(posts[0] as DirectusPost);
    } catch (error) {
      this.log("getPost", "Error:", error);
      throw DirectusError.fromError(error);
    }
  }

  async getPersonas(): Promise<Persona[]> {
    this.log("getPersonas", "Fetching all personas");
    try {
      const personas = await this.client.request(
        readItems("personas", { fields: ["*"] })
      );
      this.log("getPersonas", `Fetched ${personas.length} personas`);
      return (personas as DirectusPersona[]).map(this.mapToPersona);
    } catch (error) {
      this.log("getPersonas", "Error:", error);
      throw DirectusError.fromError(error);
    }
  }

  async getTags(): Promise<Tag[]> {
    this.log("getTags", "Fetching all tags");
    try {
      const tags = await this.client.request(
        readItems("tags", { fields: ["*"] })
      );
      this.log("getTags", `Fetched ${tags.length} tags`);
      return (tags as DirectusTag[]).map(this.mapToTag);
    } catch (error) {
      this.log("getTags", "Error:", error);
      throw DirectusError.fromError(error);
    }
  }

  private buildFilter(filters?: PostFilters): Record<string, unknown> {
    const directusFilter: Record<string, unknown> = {};

    if (!this.includeDrafts) {
      directusFilter.status = { _eq: "published" };
    }

    if (filters?.persona) {
      directusFilter.persona = { slug: { _eq: filters.persona } };
    }

    if (filters?.tag) {
      directusFilter.tags = { tags_id: { slug: { _eq: filters.tag } } };
    }

    if (filters?.year) {
      directusFilter.date_published = {
        _gte: `${filters.year}-01-01`,
        _lt: `${filters.year + 1}-01-01`,
      };
    }

    return directusFilter;
  }

  private mapToPost(post: DirectusPost): Post {
    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      date: post.date_published,
      readingTime: post.reading_time,
      persona: this.mapToPersona(post.persona),
      tags: post.tags.map((t) => this.mapToTag(t.tags_id)),
      image: post.image ? this.mapToImage(post.image) : undefined,
      attribution: post.attribution ?? undefined,
    };
  }

  private mapToPostListItem(post: DirectusPost): PostListItem {
    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      date: post.date_published,
      readingTime: post.reading_time,
      persona: this.mapToPersona(post.persona),
      tags: post.tags.map((t) => this.mapToTag(t.tags_id)),
      image: post.image ? this.mapToImage(post.image) : undefined,
    };
  }

  private mapToPersona(persona: DirectusPersona): Persona {
    return {
      id: persona.id,
      name: persona.name,
      slug: persona.slug,
      color: persona.color,
      description: persona.description ?? undefined,
    };
  }

  private mapToTag(tag: DirectusTag): Tag {
    return {
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
    };
  }

  private mapToImage(file: DirectusFile) {
    return {
      src: `${this.assetBaseUrl}/${file.id}`,
      alt: file.filename_download,
      width: file.width,
      height: file.height,
    };
  }
}
