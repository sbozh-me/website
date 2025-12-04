"use client";

import { cn } from "../../lib/utils";

export interface DividerProps {
  className?: string;
}

/**
 * CV Divider component - visual separator
 */
export function Divider({ className }: DividerProps) {
  return <hr className={cn("pmdxjs-divider my-4 border-border", className)} />;
}
