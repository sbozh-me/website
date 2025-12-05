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
 * Styling handled via CSS variables in globals.css
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
    <article className={cn("pmdxjs-entry", className)}>
      <div className="flex flex-wrap items-start justify-between gap-x-2">
        <div>
          <span className="pmdxjs-entry-role">{role}</span>
          <div className="pmdxjs-entry-company">{company}</div>
        </div>
        <div className="text-right">
          <div className="pmdxjs-entry-dates">{dates}</div>
          {location && <div className="pmdxjs-entry-location">{location}</div>}
        </div>
      </div>
      {children && <div className="pmdxjs-entry-content mt-1">{children}</div>}
    </article>
  );
}
