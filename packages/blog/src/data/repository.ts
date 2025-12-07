import type { PostFilters } from "../types/filters";
import type { Persona } from "../types/persona";
import type { Post, PostListItem } from "../types/post";
import type { Tag } from "../types/tag";

export interface BlogRepository {
  getPosts(filters?: PostFilters): Promise<PostListItem[]>;
  getPost(slug: string): Promise<Post | null>;
  getPersonas(): Promise<Persona[]>;
  getTags(): Promise<Tag[]>;
}
