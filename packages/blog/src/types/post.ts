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
  tldr?: string;
  content: string;
  date: string;
  lastModified?: string;
  readingTime: number;
  persona: Persona;
  tags: Tag[];
  image?: PostImage;
  attribution?: string;
  ogImage?: PostImage;
  ogGenerate?: boolean;
}

export interface PostListItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  date: string;
  lastModified?: string;
  readingTime: number;
  persona: Persona;
  tags: Tag[];
  image?: PostImage;
}
