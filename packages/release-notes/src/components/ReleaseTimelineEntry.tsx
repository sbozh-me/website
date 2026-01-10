"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsCollapse, setNeedsCollapse] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Check if content exceeds collapse threshold
  useEffect(() => {
    if (contentRef.current) {
      const COLLAPSE_THRESHOLD = 192; // 12rem in pixels (assuming 16px base)
      setNeedsCollapse(contentRef.current.scrollHeight > COLLAPSE_THRESHOLD);
    }
  }, [summaryContent]);

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
        <div className="relative mt-4">
          <div
            ref={contentRef}
            className={`prose prose-sm prose-muted max-w-none release-summary overflow-hidden transition-all duration-300 ${
              needsCollapse && !isExpanded ? "max-h-48" : ""
            }`}
          >
            {summaryContent}
          </div>
          {needsCollapse && !isExpanded && (
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-surface/50 to-transparent pointer-events-none" />
          )}
        </div>
      )}
      {needsCollapse && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 text-sm text-primary hover:underline focus:outline-none focus:underline"
        >
          {isExpanded ? "Show less" : "Show more"}
        </button>
      )}
      {release.media && <ReleaseMediaCard media={release.media} />}
    </>
  );

  return (
    <article className="group relative mb-12 last:mb-0">
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
            className="timeline-dot absolute top-2.5 -right-[0.5px] translate-x-1/2 h-3 w-3 rounded-full bg-primary ring-4 ring-background z-10 transition-shadow duration-200"
          />
        </div>

        {/* Content card */}
        <div className="min-w-0 flex-1 pl-6">
          <div className="release-card rounded-lg border border-border bg-surface/50 p-6 transition-all duration-200">
            <h3 className="text-lg font-semibold leading-tight text-foreground">
              {release.title}
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
          <h3 className="text-lg font-semibold leading-tight text-foreground">
            {release.title}
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
