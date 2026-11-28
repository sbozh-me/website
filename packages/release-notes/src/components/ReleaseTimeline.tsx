import type { ReleaseListItem } from "../types/release";
import { ReleaseTimelineEntry } from "./ReleaseTimelineEntry";

interface ReleaseTimelineProps {
  releases: ReleaseListItem[];
  /** Current app version from package.json */
  currentVersion?: string;
}

export function ReleaseTimeline({ releases, currentVersion }: ReleaseTimelineProps) {
  if (releases.length === 0) {
    return null;
  }

  // Only show "Latest" badge if the first release version matches current app version
  const firstReleaseIsLatest = Boolean(currentVersion && releases[0]?.version === currentVersion);

  return (
    <div className="w-full">
      {releases.map((release, index) => (
        <ReleaseTimelineEntry
          key={release.id}
          release={release}
          isLatest={index === 0 && firstReleaseIsLatest}
        />
      ))}
    </div>
  );
}
