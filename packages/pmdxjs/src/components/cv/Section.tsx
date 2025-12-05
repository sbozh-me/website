"use client";

import { cn } from "../../lib/utils";

import type { ReactNode } from "react";

export interface SectionProps {
  title: string;
  children: ReactNode;
  className?: string;
}

/**
 * CV Section component - titled content block
 */
export function Section({ title, children, className }: SectionProps) {
  return (
    <section className={cn("pmdxjs-section mb-4", className)}>
      <h2 className="mb-2 border-b-2 border-[#2b6cb0] pb-0.5 text-[13px] font-bold uppercase tracking-wider text-[#2b6cb0]">
        {title}
      </h2>
      <div className="space-y-2 text-[11px] leading-relaxed text-[#1a202c]">
        {children}
      </div>
    </section>
  );
}
