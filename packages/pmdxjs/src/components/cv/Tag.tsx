"use client";

import { cn } from "../../lib/utils";

export interface TagProps {
  children: string;
  className?: string;
}

/**
 * CV Tag component - single skill badge
 * Styling handled via CSS variables in globals.css
 */
export function Tag({ children, className }: TagProps) {
  return (
    <span className={cn("pmdxjs-tag", className)}>
      {children}
    </span>
  );
}
