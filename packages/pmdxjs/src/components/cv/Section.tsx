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
    <section className={cn("pmdxjs-section mb-5", className)}>
      <h2 className="mb-3 border-b border-border pb-1 text-lg font-semibold uppercase tracking-wide">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
