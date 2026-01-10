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
    <div className="w-full">
      {/* Timeline container with vertical line - hidden on mobile */}
      <div className="relative hidden md:block">
        {/* Vertical line connecting dots */}
        <div
          className="absolute left-[110px] top-0 bottom-0 w-px bg-border/50"
          aria-hidden="true"
        />
        {releases.map((release) => (
          <ReleaseTimelineEntry
            key={release.id}
            release={release}
            summaryContent={summaries[release.id]}
          />
        ))}
      </div>

      {/* Mobile layout without timeline */}
      <div className="md:hidden space-y-6">
        {releases.map((release) => (
          <ReleaseTimelineEntry
            key={release.id}
            release={release}
            summaryContent={summaries[release.id]}
          />
        ))}
      </div>
    </div>
  );
}
