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

  const metadataSection = (
    <>
      {/* Release type badge */}
      {typeConfig && (
        <div className={`inline-flex items-center gap-1.5 text-xs font-medium ${typeConfig.color}`}>
          <span className="text-base leading-none">{typeConfig.icon}</span>
          <span>{typeConfig.label}</span>
        </div>
      )}

      {/* Project and version info */}
      {release.project && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {typeConfig && <span>·</span>}
          <span>{release.project.name}</span>
          {release.version && (
            <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 font-mono font-medium">
              {release.version}
            </span>
          )}
          {isLatest && (
            <span className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wider text-background">
              Latest
            </span>
          )}
        </div>
      )}
    </>
  );

  const contentSection = (
    <>
      {summaryContent && (
        <div className="prose prose-sm prose-muted max-w-none release-summary mt-4">
          {summaryContent}
        </div>
      )}
      {release.media && <ReleaseMediaCard media={release.media} />}
    </>
  );

  return (
    <article className="group relative mb-12 last:mb-0">
      {/* Desktop layout: Date + circle on left, content card on right */}
      <div className="hidden md:flex items-start">
        {/* Date with circle */}
        <div className="relative shrink-0 w-[110px] pt-7.5">
          <time
            dateTime={release.dateReleased}
            className="block text-sm text-muted-foreground"
          >
            {formattedDate}
          </time>
          {/* Circle - positioned to sit on the timeline */}
          <div
            className="timeline-dot absolute top-8.5 -right-[0.5px] translate-x-1/2 h-3 w-3 rounded-full bg-primary ring-4 ring-background z-10 transition-shadow duration-200"
          />
        </div>

        {/* Content card */}
        <div className="min-w-0 flex-1 pl-6">
          <div className="release-card rounded-lg border border-border bg-surface/50 p-6 transition-all duration-200">
            <h3 className="text-lg font-semibold leading-tight">
              <Link
                href={`/projects/${release.project.slug}/releases/${release.slug}`}
                className="text-foreground hover:text-primary transition-colors"
              >
                {release.title}
              </Link>
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {metadataSection}
            </div>
            {contentSection}
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
        <div className="release-card rounded-lg border border-border bg-surface/50 p-5 transition-all duration-200">
          <h3 className="text-lg font-semibold leading-tight">
            <Link
              href={`/projects/${release.project.slug}/releases/${release.slug}`}
              className="text-foreground hover:text-primary transition-colors"
            >
              {release.title}
            </Link>
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {metadataSection}
          </div>
          {contentSection}
        </div>
      </div>
    </article>
  );
}
