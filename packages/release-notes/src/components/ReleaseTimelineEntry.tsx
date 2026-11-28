"use client";

import Link from "next/link";
import type { ReleaseListItem, ReleaseType } from "../types/release";
import { formatReleaseDate } from "../utils/date-format";

interface ReleaseTimelineEntryProps {
  release: ReleaseListItem;
  /** Whether this is the latest release */
  isLatest?: boolean;
}

const RELEASE_TYPE_CONFIG: Record<ReleaseType, { icon: string; label: string; color: string }> = {
  feature: { icon: "✦", label: "Feature", color: "text-primary" },
  fix: { icon: "⚡", label: "Fix", color: "text-secondary" },
  breaking: { icon: "⚠", label: "Breaking", color: "text-red-500" },
  maintenance: { icon: "◆", label: "Maintenance", color: "text-muted-foreground" },
};

/**
 * One release in a list: title, type, date and version, and the whole card opens the
 * release's own page, where the note is read in full.
 */
export function ReleaseTimelineEntry({ release, isLatest = false }: ReleaseTimelineEntryProps) {
  const formattedDate = formatReleaseDate(release.dateReleased);
  const typeConfig = release.type ? RELEASE_TYPE_CONFIG[release.type] : null;

  return (
    <article className="mb-3">
      <Link
        href={`/projects/${release.project.slug}/releases/${release.slug}`}
        className="group block rounded-lg border border-border bg-muted px-5 py-4 transition-colors duration-200 hover:border-primary"
      >
        <h3 className="text-base font-semibold leading-tight text-foreground transition-colors group-hover:text-primary">
          {release.title}
        </h3>

        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm">
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
      </Link>
    </article>
  );
}
