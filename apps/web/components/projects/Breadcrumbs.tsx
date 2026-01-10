import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbSegment {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  segments: BreadcrumbSegment[];
}

export function Breadcrumbs({ segments }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1;
        return (
          <span key={index} className="contents">
            {index > 0 && <ChevronRight className="size-4" />}
            {segment.href && !isLast ? (
              <Link href={segment.href} className="hover:text-foreground transition-colors">
                {segment.label}
              </Link>
            ) : (
              <span className={isLast ? "text-foreground truncate max-w-[200px]" : ""}>
                {segment.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
