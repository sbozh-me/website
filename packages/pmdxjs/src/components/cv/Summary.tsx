"use client";

import { cn } from "../../lib/utils";

import type { ReactNode } from "react";

export interface SummaryProps {
  children: ReactNode;
  className?: string;
}

/**
 * CV Summary component - prose block for professional summary
 */
export function Summary({ children, className }: SummaryProps) {
  return (
    <div
      className={cn(
        "pmdxjs-summary mb-4 text-sm leading-relaxed text-muted-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}
