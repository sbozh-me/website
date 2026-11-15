import { SeriesStatusBadge } from "../series/SeriesStatusBadge";

export interface PlannedBadgeProps {
  className?: string;
}

/** A post whose publish time is still ahead; same look as a planned series */
export function PlannedBadge({ className }: PlannedBadgeProps) {
  return <SeriesStatusBadge status="planned" className={className} />;
}
