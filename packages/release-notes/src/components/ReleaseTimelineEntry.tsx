import type { ReleaseListItem } from "../types/release";
import { formatReleaseDate } from "../utils/date-format";
import { ReleaseMediaCard } from "./ReleaseMediaCard";

interface ReleaseTimelineEntryProps {
  release: ReleaseListItem;
  isLast?: boolean;
}

export function ReleaseTimelineEntry({
  release,
  isLast = false,
}: ReleaseTimelineEntryProps) {
  const formattedDate = formatReleaseDate(release.dateReleased);

  return (
    <article className="relative grid grid-cols-1 gap-2 pb-8 md:grid-cols-[140px_24px_1fr] md:gap-6 md:pb-12">
      {/* Date - visible on mobile above content, on desktop in left column */}
      <time
        dateTime={release.dateReleased}
        className="text-sm text-muted-foreground md:text-right"
      >
        {formattedDate}
      </time>

      {/* Timeline dot and line - hidden on mobile */}
      <div className="relative hidden justify-center md:flex">
        {/* Dot */}
        <div className="z-10 h-3 w-3 rounded-full bg-primary" />
        {/* Vertical line */}
        {!isLast && (
          <div className="absolute left-1/2 top-3 h-full w-px -translate-x-1/2 bg-border" />
        )}
      </div>

      {/* Content */}
      <div className="flex items-start gap-3 md:block">
        {/* Mobile dot */}
        <div className="mt-1.5 h-3 w-3 shrink-0 rounded-full bg-primary md:hidden" />
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold leading-tight text-foreground">
            {release.title}
          </h3>
          {release.summary && (
            <p className="mt-2 text-muted-foreground">{release.summary}</p>
          )}
          {release.media && <ReleaseMediaCard media={release.media} />}
        </div>
      </div>
    </article>
  );
}
