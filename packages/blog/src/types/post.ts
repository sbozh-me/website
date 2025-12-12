import type { Persona } from "./persona";
import type { Tag } from "./tag";

export interface PostImage {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

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
  image?: PostImage;
  attribution?: string;
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
  image?: PostImage;
}
