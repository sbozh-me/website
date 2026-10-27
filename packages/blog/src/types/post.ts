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
  /** Plain text: the tab title, cards, prev/next links */
  title: string;
  /** The title as written, with inline syntax for the post page heading (when it has any) */
  titleMarkup?: string;
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
  imageAttribution?: string;
  attribution?: string;
  ogImage?: PostImage;
  ogGenerate?: boolean;
  isTocHidden?: boolean;
  theme?: string;
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
  /** Editor-picked next post; overrides the chronological neighbour */
  nextPostId?: string;
}
