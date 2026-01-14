"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { ReleaseListItem, ReleaseType } from "../types/release";
import { formatReleaseDate } from "../utils/date-format";
import { ReleaseMediaCard } from "./ReleaseMediaCard";

interface ReleaseTimelineEntryProps {
  release: ReleaseListItem;
  /** Pre-rendered MDX content for summary */
  summaryContent: ReactNode;
  /** Whether this is the latest release */
  isLatest?: boolean;
}

const RELEASE_TYPE_CONFIG: Record<ReleaseType, { icon: string; label: string; color: string }> = {
  feature: { icon: "✦", label: "Feature", color: "text-primary" },
  fix: { icon: "⚡", label: "Fix", color: "text-secondary" },
  breaking: { icon: "⚠", label: "Breaking", color: "text-red-500" },
  maintenance: { icon: "◆", label: "Maintenance", color: "text-muted-foreground" },
};

export function ReleaseTimelineEntry({
  release,
  summaryContent,
  isLatest = false,
}: ReleaseTimelineEntryProps) {
  const formattedDate = formatReleaseDate(release.dateReleased);
  const typeConfig = release.type ? RELEASE_TYPE_CONFIG[release.type] : null;

  return (
    <article className="group block rounded-lg border border-border bg-muted p-6 mb-6 transition-all duration-200 hover:border-primary">
      <h3 className="text-lg font-semibold leading-tight text-foreground">
        <Link
          href={`/projects/${release.project.slug}/releases/${release.slug}`}
          className="hover:text-primary transition-colors"
        >
          {release.title}
        </Link>
      </h3>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
        {/* Release type */}
        {typeConfig && (
          <span className={`inline-flex items-center gap-1 font-medium ${typeConfig.color}`}>
            <span className="text-base leading-none">{typeConfig.icon}</span>
            <span>{typeConfig.label}</span>
          </span>
        )}

        {typeConfig && <span className="text-muted-foreground">·</span>}

        {/* Date */}
        <time dateTime={release.dateReleased} className="text-muted-foreground">
          {formattedDate}
        </time>

        {/* Version badge */}
        {release.version && (
          <>
            <span className="text-muted-foreground">·</span>
            <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-mono font-medium">
              {release.version}
            </span>
          </>
        )}

        {/* Latest badge */}
        {isLatest && (
          <span className="inline-flex items-center rounded-full border border-primary px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wider text-primary">
            Latest
          </span>
        )}
      </div>

      {/* Summary content */}
      {summaryContent && (
        <div className="prose prose-sm prose-muted max-w-none release-summary mt-4">
          {summaryContent}
        </div>
      )}

      {/* Media */}
      {release.media && <ReleaseMediaCard media={release.media} />}
    </article>
  );
}
