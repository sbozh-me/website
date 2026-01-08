import type { ReactNode } from "react";
import type { ReleaseListItem } from "../types/release";
import { formatReleaseDate } from "../utils/date-format";
import { ReleaseMediaCard } from "./ReleaseMediaCard";

interface ReleaseTimelineEntryProps {
  release: ReleaseListItem;
  /** Pre-rendered MDX content for summary */
  summaryContent: ReactNode;
}

export function ReleaseTimelineEntry({
  release,
  summaryContent,
}: ReleaseTimelineEntryProps) {
  const formattedDate = formatReleaseDate(release.dateReleased);

  return (
    <article className="relative md:pb-12">
      {/* Header row: Date with circle - Title */}
      <div className="flex items-start">
        {/* Date with circle */}
        <time
          dateTime={release.dateReleased}
          className="relative shrink-0 w-[110px] pt-1 text-sm text-muted-foreground"
        >
          {formattedDate}
          {/* Circle - positioned to sit on the border */}
          <div
            className="absolute top-2.5 right-0 translate-x-1/2 h-3 w-3 rounded-full bg-primary z-10"
          />
        </time>

        {/* Title and content - border becomes the timeline */}
        <div className="min-w-0 flex-1 pl-6 border-l border-border">
          {release.version}
          <h3 className="text-lg font-semibold leading-tight text-foreground">
            {release.title}
          </h3>
          {summaryContent && (
            <div className="mt-3 prose prose-sm prose-muted">
              {summaryContent}
            </div>
          )}
          {release.media && <ReleaseMediaCard media={release.media} />}
        </div>
      </div>
    </article>
  );
}
