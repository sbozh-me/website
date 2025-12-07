import type { Persona } from "./persona";
import type { Tag } from "./tag";

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  date: string;
  readingTime: number;
  persona: Persona;
  tags: Tag[];
}

export interface PostListItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  date: string;
  readingTime: number;
  persona: Persona;
  tags: Tag[];
}
