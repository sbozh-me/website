import type { ReactNode } from "react";
import type { ReleaseListItem } from "../types/release";
import { formatReleaseDate } from "../utils/date-format";
import { ReleaseMediaCard } from "./ReleaseMediaCard";

interface ReleaseTimelineEntryProps {
  release: ReleaseListItem;
  /** Pre-rendered MDX content (ReactNode) or HTML string for summary */
  summaryContent: ReactNode | string;
}

export function ReleaseTimelineEntry({
  release,
  summaryContent,
}: ReleaseTimelineEntryProps) {
  const formattedDate = formatReleaseDate(release.dateReleased);

  return (
    <article className="relative md:pb-12 border-b border-border last:border-b-0">
      {/* Header row: Date with circle - Title */}
      <div className="flex items-start pt-12">
        {/* Date with circle */}
        <div className="relative shrink-0 w-[110px] pt-1.5">
          <time
            dateTime={release.dateReleased}
            className="block text-sm text-muted-foreground"
          >
            {formattedDate}
          </time>
          {/* Circle - positioned to sit on the border */}
          <div
            className="absolute top-2.5 -right-[0.5px] translate-x-1/2 h-3 w-3 rounded-full bg-primary z-10"
          />
        </div>

        {/* Title and content - border becomes the timeline */}
        <div className="min-w-0 flex-1 pl-6">
          <h3 className="text-lg font-semibold leading-tight text-foreground">
            {release.title}
          </h3>
          {release.project && (
            <span className="block text-sm text-muted-foreground mt-1">
              {release.project.name}{release.version && ` - ${release.version}`}
            </span>
          )}
          {summaryContent && (
            <div className="mt-3 prose prose-sm prose-muted">
              {typeof summaryContent === "string" ? (
                <div dangerouslySetInnerHTML={{ __html: summaryContent }} />
              ) : (
                summaryContent
              )}
            </div>
          )}
          {release.media && <ReleaseMediaCard media={release.media} />}
        </div>
      </div>
    </article>
  );
}
