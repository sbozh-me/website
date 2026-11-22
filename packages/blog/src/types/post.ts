import type { Persona } from "./persona";
import type { Tag } from "./tag";

export const POST_TYPES = ["laws", "stories", "articles", "journal", "music"] as const;
export type PostType = (typeof POST_TYPES)[number];

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
  /** Post category: Laws (Principate decrees), Stories (narrative), Articles (essays), Journal (daily logs) */
  type?: PostType;
  /** Paid post: the body is only served after the content password is entered */
  isLocked?: boolean;
  /** Not published yet; only reachable through a draft preview link */
  isDraft?: boolean;
  /** Published with a publish time still ahead: listed with a badge, body held back until then */
  isPlanned?: boolean;
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
  /** Series this post belongs to; previous/next stay inside it */
  seriesId?: string;
  /** Post category: Laws (Principate decrees), Stories (narrative), Articles (essays), Journal (daily logs) */
  type?: PostType;
  /** Paid post: the body is only served after the content password is entered */
  isLocked?: boolean;
  /** Publish time still ahead: listed with a Planned badge */
  isPlanned?: boolean;
}
