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
 * Columns component - two-column layout with configurable ratio
 *
 * @param ratio - Width ratio for columns, e.g., [60, 40] for 60%/40% split
 * @param gap - Gap between columns in pixels (default: 20)
 */
export function Columns({
  ratio: _ratio,
  children,
  className,
  gap = 20,
}: ColumnsProps) {
  return (
    <div
      className={cn("pmdxjs-columns", "flex", className)}
      style={{ gap: `${gap}px` }}
    >
      {children}
    </div>
  );
}

export interface ColumnProps {
  children: ReactNode;
  className?: string;
  /** Width as percentage (0-100) */
  width?: number;
}

/**
 * Column component - single column within Columns
 */
export function Column({ children, className, width }: ColumnProps) {
  return (
    <div
      className={cn("pmdxjs-column", "flex-shrink-0", className)}
      style={width ? { width: `${width}%` } : undefined}
    >
      {children}
    </div>
  );
}
