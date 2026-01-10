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
    <article className="relative mb-12 last:mb-0">
      {/* Desktop layout: Date + circle on left, content card on right */}
      <div className="hidden md:flex items-start">
        {/* Date with circle */}
        <div className="relative shrink-0 w-[110px] pt-1.5">
          <time
            dateTime={release.dateReleased}
            className="block text-sm text-muted-foreground"
          >
            {formattedDate}
          </time>
          {/* Circle - positioned to sit on the timeline */}
          <div
            className="absolute top-2.5 -right-[0.5px] translate-x-1/2 h-3 w-3 rounded-full bg-primary ring-4 ring-background z-10"
          />
        </div>

        {/* Content card */}
        <div className="min-w-0 flex-1 pl-6">
          <div className="rounded-lg border border-border bg-surface/50 p-6">
            <h3 className="text-lg font-semibold leading-tight text-foreground">
              {release.title}
            </h3>
            {release.project && (
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <span>{release.project.name}</span>
                {release.version && (
                  <>
                    <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 font-mono font-medium">
                      {release.version}
                    </span>
                  </>
                )}
              </div>
            )}
            {summaryContent && (
              <div className="mt-4 prose prose-sm prose-muted max-w-none release-summary">
                {summaryContent}
              </div>
            )}
            {release.media && <ReleaseMediaCard media={release.media} />}
          </div>
        </div>
      </div>

      {/* Mobile layout: Date badge above content */}
      <div className="md:hidden">
        <time
          dateTime={release.dateReleased}
          className="inline-block mb-3 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
        >
          {formattedDate}
        </time>
        <div className="rounded-lg border border-border bg-surface/50 p-5">
          <h3 className="text-lg font-semibold leading-tight text-foreground">
            {release.title}
          </h3>
          {release.project && (
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span>{release.project.name}</span>
              {release.version && (
                <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 font-mono font-medium">
                  {release.version}
                </span>
              )}
            </div>
          )}
          {summaryContent && (
            <div className="mt-4 prose prose-sm prose-muted max-w-none release-summary">
              {summaryContent}
            </div>
          )}
          {release.media && <ReleaseMediaCard media={release.media} />}
        </div>
      </div>
    </article>
  );
}
