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
 * Styling handled via CSS variables in globals.css
 */
export function Section({ title, children, className }: SectionProps) {
  return (
    <section className={cn("pmdxjs-section", className)}>
      <h2>{title}</h2>
      <div className="pmdxjs-section-content">{children}</div>
    </section>
  );
}
