import { mockPersonas, mockPosts, mockTags } from "./mock-data";

import type { BlogRepository } from "./repository";
import type { PostFilters } from "../types/filters";
import type { Persona } from "../types/persona";
import type { Post, PostListItem } from "../types/post";
import type { Tag } from "../types/tag";

export class MockBlogRepository implements BlogRepository {
  async getPosts(filters?: PostFilters): Promise<PostListItem[]> {
    let posts = [...mockPosts];

    if (filters?.persona) {
      posts = posts.filter((p) => p.persona.slug === filters.persona);
    }

    if (filters?.tag) {
      posts = posts.filter((p) => p.tags.some((t) => t.slug === filters.tag));
    }

    if (filters?.year) {
      posts = posts.filter(
        (p) => new Date(p.date).getFullYear() === filters.year,
      );
    }

    return posts
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(({ content: _, ...post }) => post);
  }

  async getPost(slug: string): Promise<Post | null> {
    return mockPosts.find((p) => p.slug === slug) ?? null;
  }

  async getPersonas(): Promise<Persona[]> {
    return [...mockPersonas];
  }

  async getTags(): Promise<Tag[]> {
    return [...mockTags];
  }
}
