import { getAllEntries } from "@/lib/feed/entries";
import { feedResponse } from "@/lib/feed/rss";

// Feed fetches dynamic data from Directus, so render dynamically (same as the sitemap)
export const dynamic = "force-dynamic";

export function GET() {
  return feedResponse(
    {
      title: "sbozh.me",
      link: "/",
      description: "Blog posts and release notes from sbozh.me, built and shipped in public.",
      self: "/rss.xml",
    },
    getAllEntries
  );
}
