import { TOPICS, type Topic } from "@/lib/subscribers/topics";

/** Feed URLs per channel. Kept free of server imports so client components (the footer's feed menu) can use it. */
export const FEED_PATHS = {
  all: { rss: "/rss.xml", atom: "/atom.xml" },
  blog: { rss: "/blog/rss.xml", atom: "/blog/atom.xml" },
  releases: { rss: "/releases/rss.xml", atom: "/releases/atom.xml" },
} as const;

export interface FeedPaths {
  rss: string;
  atom: string;
}

/** Query parameter on /rss.xml and /atom.xml that narrows the feed: ?topics=blog, ?topics=releases */
export const TOPICS_PARAM = "topics";

/** Known topics from "blog,releases", in canonical order; empty or unknown means every topic */
export function parseTopicsParam(value: string | null | undefined): Topic[] {
  const requested = (value ?? "").split(",").map((topic) => topic.trim());
  const topics = TOPICS.filter((topic) => requested.includes(topic));
  return topics.length ? topics : [...TOPICS];
}

/** Site-wide feed URLs for a topic selection; every topic is the plain /rss.xml */
export function feedPathsFor(topics: readonly Topic[]): FeedPaths {
  const selected = TOPICS.filter((topic) => topics.includes(topic));
  if (selected.length === 0 || selected.length === TOPICS.length) return FEED_PATHS.all;
  const query = `?${TOPICS_PARAM}=${selected.join(",")}`;
  return { rss: `${FEED_PATHS.all.rss}${query}`, atom: `${FEED_PATHS.all.atom}${query}` };
}
