import { getBlogEntries } from "@/lib/feed/entries";
import { feedResponse } from "@/lib/feed/rss";

export const dynamic = "force-dynamic";

export function GET() {
  return feedResponse(
    {
      title: "sbozh.me blog",
      link: "/blog",
      description: "A place where I build and ship things in public.",
      self: "/blog/rss.xml",
    },
    getBlogEntries
  );
}
