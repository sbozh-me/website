import { createBlogRepository } from "@/lib/blog/repository";
import { directusRest } from "@/lib/directus/rest";
import type { Topic } from "@/lib/subscribers/topics";

/** Absolute links in feeds and emails; SITE_URL lets a dev server mail links that point back to itself */
export const SITE_URL = (process.env.SITE_URL || "https://sbozh.me").replace(/\/$/, "");

/** One announceable thing, shared by the RSS feeds and the subscriber emails */
export interface FeedEntry {
  topic: Topic;
  title: string;
  url: string;
  /** ISO date */
  date: string;
  /** Plain-text teaser for feed readers */
  description: string;
}

export interface DirectusRelease {
  id: string;
  slug: string;
  version: string;
  title: string;
  summary: string | null;
  date_released: string;
  project: { name: string; slug: string } | null;
}

export const RELEASE_FIELDS = "id,slug,version,title,summary,date_released,project.name,project.slug";

export function postUrl(slug: string): string {
  return `${SITE_URL}/blog/${slug}`;
}

export function releaseUrl(release: Pick<DirectusRelease, "slug" | "project">): string {
  return `${SITE_URL}/projects/${release.project?.slug ?? "sbozh-me"}/releases/${release.slug}`;
}

/** "sbozh.me v1.8.2: Feeds and subscriptions" */
export function releaseTitle(release: Pick<DirectusRelease, "version" | "title" | "project">): string {
  const name = [release.project?.name, release.version].filter(Boolean).join(" ");
  return name ? `${name}: ${release.title}` : release.title;
}

/** Release summaries are markdown; feed readers get a short plain-text teaser */
export function teaser(markdown: string | null, maxLength = 280): string {
  const text = (markdown ?? "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^#+\s*/gm, "")
    .replace(/[*_`>~]/g, "")
    .replace(/^\s*[-+]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1).trimEnd()}…` : text;
}

export async function getBlogEntries(): Promise<FeedEntry[]> {
  const posts = await createBlogRepository().getPosts();
  return posts.map((post) => ({
    topic: "blog",
    title: post.title,
    url: postUrl(post.slug),
    date: post.date,
    description: post.excerpt,
  }));
}

const FEED_LIMIT = 50;

export async function getReleaseEntries(): Promise<FeedEntry[]> {
  const query = new URLSearchParams({
    "filter[status][_eq]": "published",
    "filter[date_released][_lte]": "$NOW",
    fields: RELEASE_FIELDS,
    sort: "-date_released",
    limit: String(FEED_LIMIT),
  });
  const { data } = await directusRest<{ data: DirectusRelease[] }>(`/items/release_notes?${query}`);
  return data.map((release) => ({
    topic: "releases",
    title: releaseTitle(release),
    url: releaseUrl(release),
    date: release.date_released,
    description: teaser(release.summary),
  }));
}

/** Newest first, across topics */
export async function getAllEntries(): Promise<FeedEntry[]> {
  const [blog, releases] = await Promise.all([getBlogEntries(), getReleaseEntries()]);
  return [...blog, ...releases].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}
