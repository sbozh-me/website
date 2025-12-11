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
}

export class DirectusRepository implements BlogRepository {
  private client: RestClient<DirectusSchema>;
  private assetBaseUrl: string;
  private includeDrafts: boolean;

  constructor(config: DirectusConfig) {
    this.assetBaseUrl = config.assetBaseUrl ?? `${config.url}/assets`;
    this.includeDrafts = config.includeDrafts ?? false;

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

  async getPosts(filters?: PostFilters): Promise<PostListItem[]> {
    try {
      const directusFilter = this.buildFilter(filters);

      const posts = await this.client.request(
        readItems("posts", {
          filter: directusFilter,
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
          ],
          sort: ["-date_published"],
        })
      );

      return (posts as DirectusPost[]).map(this.mapToPostListItem.bind(this));
    } catch (error) {
      throw DirectusError.fromError(error);
    }
  }

  async getPost(slug: string): Promise<Post | null> {
    try {
      const filter: Record<string, unknown> = { slug: { _eq: slug } };
      if (!this.includeDrafts) {
        filter.status = { _eq: "published" };
      }

      const posts = await this.client.request(
        readItems("posts", {
          filter,
          fields: [
            "*",
            { persona: ["*"] },
            { tags: [{ tags_id: ["*"] }] },
            { image: ["*"] },
          ],
          limit: 1,
        })
      );

      if (posts.length === 0) return null;
      return this.mapToPost(posts[0] as DirectusPost);
    } catch (error) {
      throw DirectusError.fromError(error);
    }
  }

  async getPersonas(): Promise<Persona[]> {
    try {
      const personas = await this.client.request(
        readItems("personas", { fields: ["*"] })
      );
      return (personas as DirectusPersona[]).map(this.mapToPersona);
    } catch (error) {
      throw DirectusError.fromError(error);
    }
  }

  async getTags(): Promise<Tag[]> {
    try {
      const tags = await this.client.request(
        readItems("tags", { fields: ["*"] })
      );
      return (tags as DirectusTag[]).map(this.mapToTag);
    } catch (error) {
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
