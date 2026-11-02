import type { Avatar } from "../types/avatar";
import type { PostFilters } from "../types/filters";
import type { Persona } from "../types/persona";
import type { Post, PostListItem } from "../types/post";
import type { Series } from "../types/series";
import type { Tag } from "../types/tag";

export interface BlogRepository {
  getPosts(filters?: PostFilters): Promise<PostListItem[]>;
  getPost(slug: string): Promise<Post | null>;
  getPersonas(): Promise<Persona[]>;
  /** Avatars in display order, each with its personas */
  getAvatars(): Promise<Avatar[]>;
  getTags(): Promise<Tag[]>;
  getSeries(): Promise<Series[]>;
}
