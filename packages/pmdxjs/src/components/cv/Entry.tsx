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
    <article className={cn("pmdxjs-entry mb-3", className)}>
      <div className="flex flex-wrap items-start justify-between gap-x-2">
        <div>
          <span className="text-[12px] font-semibold text-[#2b6cb0]">
            {role}
          </span>
          <div className="text-[11px] font-medium text-[#1a365d]">
            {company}
          </div>
        </div>
        <div className="text-[10px] text-[#718096]">
          <div>{dates}</div>
          {location && <div>{location}</div>}
        </div>
      </div>
      {children && (
        <div className="mt-1 text-[10px] leading-relaxed text-[#4a5568]">
          {children}
        </div>
      )}
    </article>
  );
}
