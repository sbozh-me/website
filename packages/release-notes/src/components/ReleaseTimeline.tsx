import type { ReleaseListItem } from "../types/release";
import { ReleaseTimelineEntry } from "./ReleaseTimelineEntry";

interface ReleaseTimelineProps {
  releases: ReleaseListItem[];
}

export function ReleaseTimeline({ releases }: ReleaseTimelineProps) {
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
        />
      ))}
    </section>
  );
}
