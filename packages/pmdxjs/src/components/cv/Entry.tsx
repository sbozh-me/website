"use client";

import { cn } from "../../lib/utils";

import type { ReactNode } from "react";

export interface EntryProps {
  company: string;
  role: string;
  dates: string;
  location?: string;
  children?: ReactNode;
  className?: string;
}

/**
 * CV Entry component - job/education entry with metadata
 */
export function Entry({
  company,
  role,
  dates,
  location,
  children,
  className,
}: EntryProps) {
  return (
    <article className={cn("pmdxjs-entry mb-4", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold">{company}</span>
          <span className="text-muted-foreground">|</span>
          <span className="text-muted-foreground">{role}</span>
        </div>
        <div className="text-sm text-muted-foreground">
          {dates}
          {location && ` | ${location}`}
        </div>
      </div>
      {children && <div className="mt-2 text-sm">{children}</div>}
    </article>
  );
}
