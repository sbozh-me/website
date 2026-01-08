import type { ReactNode } from "react";
import type { ReleaseListItem } from "../types/release";
import { ReleaseTimelineEntry } from "./ReleaseTimelineEntry";

interface ReleaseTimelineProps {
  releases: ReleaseListItem[];
  /** Map of release ID to pre-rendered MDX summary content */
  summaries: Record<string, ReactNode>;
}

export function ReleaseTimeline({ releases, summaries }: ReleaseTimelineProps) {
  if (releases.length === 0) {
    return null;
  }

  return (
    <section className="w-full">
      {releases.map((release, index) => (
        <ReleaseTimelineEntry
          key={release.id}
          release={release}
          isLast={index === releases.length - 1}
          summaryContent={summaries[release.id]}
        />
      ))}
    </section>
  );
}
