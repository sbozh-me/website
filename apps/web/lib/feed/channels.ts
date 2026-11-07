import { getAllEntries, getBlogEntries, getReleaseEntries, type FeedEntry } from "./entries";
import { FEED_PATHS } from "./paths";

export interface FeedChannel {
  title: string;
  /** Path of the HTML page the feed mirrors, e.g. "/blog" */
  link: string;
  description: string;
  /** Paths the feed is served at, one per format */
  rss: string;
  atom: string;
  load: () => Promise<FeedEntry[]>;
}

export const FEEDS = {
  all: {
    title: "sbozh.me",
    link: "/",
    description: "Blog posts and release notes from sbozh.me, built and shipped in public.",
    ...FEED_PATHS.all,
    load: getAllEntries,
  },
  blog: {
    title: "sbozh.me blog",
    link: "/blog",
    description: "A place where I build and ship things in public.",
    ...FEED_PATHS.blog,
    load: getBlogEntries,
  },
  releases: {
    title: "sbozh.me releases",
    link: "/projects",
    description: "Release notes for sbozh.me and its projects.",
    ...FEED_PATHS.releases,
    load: getReleaseEntries,
  },
} satisfies Record<string, FeedChannel>;
