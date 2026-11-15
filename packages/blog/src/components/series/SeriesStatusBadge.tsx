import { Badge } from "@sbozh/react-ui/components/ui/badge";
import { cn } from "@sbozh/react-ui/lib/utils";

import type { SeriesStatus } from "../../types/series";

const styles: Record<SeriesStatus, { label: string; badge: string; dot: string }> = {
  planned: {
    label: "Planned",
    badge: "border-dashed border-secondary/50 text-secondary",
    dot: "border border-secondary",
  },
  ongoing: {
    label: "Ongoing",
    badge: "border-accent/40 bg-linear-to-r from-accent/10 to-accent/10 text-accent",
    dot: "bg-accent animate-pulse",
  },
  finished: {
    label: "Finished",
    badge: "border-primary/40 bg-linear-to-r from-primary/10 to-primary/10 text-primary",
    dot: "bg-primary",
  },
};

export interface SeriesStatusBadgeProps {
  status: SeriesStatus;
  className?: string;
}

/**
 * Where a series stands: planned, ongoing (pulsing) or finished. Inside a dark island, on
 * solid obsidian whatever the reader's theme, so it reads on any Hero image; the status
 * tint is a gradient layer over that colour.
 */
export function SeriesStatusBadge({ status, className }: SeriesStatusBadgeProps) {
  const { label, badge, dot } = styles[status];

  // The island is a box-less wrapper: on the badge itself its unlayered `color` would
  // beat the status colour
  return (
    <span data-theme-island="obsidian-forge" className="contents">
      <Badge
        variant="outline"
        data-status={status}
        className={cn("gap-1.5 bg-background", badge, className)}
      >
        <span aria-hidden="true" className={cn("size-1.5 rounded-full", dot)} />
        {label}
      </Badge>
    </span>
  );
}
