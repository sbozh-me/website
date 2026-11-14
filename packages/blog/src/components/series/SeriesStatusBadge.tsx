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
    badge: "border-accent/40 bg-accent/10 text-accent",
    dot: "bg-accent animate-pulse",
  },
  finished: {
    label: "Finished",
    badge: "border-primary/40 bg-primary/10 text-primary",
    dot: "bg-primary",
  },
};

export interface SeriesStatusBadgeProps {
  status: SeriesStatus;
  className?: string;
}

/** Where a series stands: planned, ongoing (pulsing) or finished */
export function SeriesStatusBadge({ status, className }: SeriesStatusBadgeProps) {
  const { label, badge, dot } = styles[status];

  return (
    <Badge variant="outline" data-status={status} className={cn("gap-1.5", badge, className)}>
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", dot)} />
      {label}
    </Badge>
  );
}
