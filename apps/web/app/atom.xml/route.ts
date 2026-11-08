import { channelForTopics } from "@/lib/feed/channels";
import { parseTopicsParam, TOPICS_PARAM } from "@/lib/feed/paths";
import { feedResponse } from "@/lib/feed/rss";

// Feeds read Directus at request time, like the sitemap
export const dynamic = "force-dynamic";

/** ?topics=blog or ?topics=releases narrows the feed; no parameter serves everything */
export function GET(request: Request) {
  const topics = parseTopicsParam(new URL(request.url).searchParams.get(TOPICS_PARAM));
  return feedResponse(channelForTopics(topics), "atom");
}
