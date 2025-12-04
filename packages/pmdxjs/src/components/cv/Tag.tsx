"use client";

import { cn } from "../../lib/utils";

export interface TagProps {
  children: string;
  className?: string;
}

/**
 * CV Tag component - single skill badge
 */
export function Tag({ children, className }: TagProps) {
  return (
    <span
      className={cn(
        "pmdxjs-tag inline-block rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}
