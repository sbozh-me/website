/** Feed URLs per channel. Kept free of server imports so client components (the footer's feed menu) can use it. */
export const FEED_PATHS = {
  all: { rss: "/rss.xml", atom: "/atom.xml" },
  blog: { rss: "/blog/rss.xml", atom: "/blog/atom.xml" },
  releases: { rss: "/releases/rss.xml", atom: "/releases/atom.xml" },
} as const;

export type FeedPaths = (typeof FEED_PATHS)[keyof typeof FEED_PATHS];
