import { getReleaseEntries } from "@/lib/feed/entries";
import { feedResponse } from "@/lib/feed/rss";

export const dynamic = "force-dynamic";

export function GET() {
  return feedResponse(
    {
      title: "sbozh.me releases",
      link: "/projects",
      description: "Release notes for sbozh.me and its projects.",
      self: "/releases/rss.xml",
    },
    getReleaseEntries
  );
}
