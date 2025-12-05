"use client";

import { cn } from "../../lib/utils";

export interface TagProps {
  children: string;
  className?: string;
}

/**
 * CV Tag component - single skill badge with underline
 */
export function Tag({ children, className }: TagProps) {
  return (
    <span
      className={cn(
        "pmdxjs-tag inline-block border-b border-[#cbd5e0] pb-0.5 text-[10px] text-[#1a202c]",
        className,
      )}
    >
      {children}
    </span>
  );
}
