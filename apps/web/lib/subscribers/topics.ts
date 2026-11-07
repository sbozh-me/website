/** What a subscriber can get emailed about; mirrors subscribers.topics in Directus */
export const TOPICS = ["blog", "releases"] as const;

export type Topic = (typeof TOPICS)[number];

export const TOPIC_LABELS: Record<Topic, string> = {
  blog: "Blog posts",
  releases: "Release notes",
};

/** Keeps the known topics from untrusted input, in canonical order, without duplicates */
export function parseTopics(value: unknown): Topic[] {
  if (!Array.isArray(value)) return [];
  return TOPICS.filter((topic) => value.includes(topic));
}

/** "blog posts and release notes" */
export function describeTopics(topics: readonly Topic[]): string {
  return topics.map((topic) => TOPIC_LABELS[topic].toLowerCase()).join(" and ");
}
