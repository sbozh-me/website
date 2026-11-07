import { FEEDS } from "@/lib/feed/channels";
import { feedResponse } from "@/lib/feed/rss";

// Feeds read Directus at request time, like the sitemap
export const dynamic = "force-dynamic";

export function GET() {
  return feedResponse(FEEDS.releases, "atom");
}
