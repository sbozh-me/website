import { Badge } from "@sbozh/react-ui/components/ui/badge";
import { cn } from "@sbozh/react-ui/lib/utils";
import type { ProjectStatus } from "@/lib/projects/types";

interface StatusBadgeProps {
  status: ProjectStatus;
  className?: string;
}

const statusConfig: Record<
  ProjectStatus,
  { label: string; className: string }
> = {
  active: {
    label: "Active",
    className: "bg-accent text-accent-foreground",
  },
  beta: {
    label: "Beta",
    className: "bg-secondary text-secondary-foreground",
  },
  "coming-soon": {
    label: "Coming Soon",
    className: "bg-muted text-muted-foreground border-border",
  },
  archived: {
    label: "Archived",
    className: "bg-muted text-muted-foreground border-border",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      variant="outline"
      className={cn(config.className, className)}
      aria-label={`Project status: ${config.label}`}
    >
      {config.label}
    </Badge>
  );
}
