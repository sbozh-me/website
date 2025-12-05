"use client";

import { cn } from "../lib/utils";

import type { ReactNode } from "react";

export interface ColumnsProps {
  ratio: [number, number];
  children: ReactNode;
  className?: string;
  gap?: number;
}

/**
 * Columns component - two-column layout with configurable ratio using CSS Grid
 *
 * @param ratio - Width ratio for columns, e.g., [60, 40] for 60%/40% split
 * @param gap - Gap between columns in pixels (default: 20)
 */
export function Columns({
  ratio,
  children,
  className,
  gap = 20,
}: ColumnsProps) {
  const [left, right] = ratio;

  return (
    <div
      className={cn("pmdxjs-columns", "grid", className)}
      style={{
        gridTemplateColumns: `${left}fr ${right}fr`,
        gap: `${gap}px`,
      }}
    >
      {children}
    </div>
  );
}

export interface ColumnProps {
  children: ReactNode;
  className?: string;
  /** Width is now handled by parent grid, kept for backwards compatibility */
  width?: number;
}

/**
 * Column component - single column within Columns grid
 */
export function Column({ children, className }: ColumnProps) {
  return (
    <div className={cn("pmdxjs-column", "min-w-0", className)}>{children}</div>
  );
}
