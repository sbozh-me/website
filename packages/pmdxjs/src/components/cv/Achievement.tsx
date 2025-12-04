"use client";

import { cn } from "../../lib/utils";

export interface AchievementProps {
  children: string;
  className?: string;
}

/**
 * CV Achievement component - bullet point achievement item
 */
export function Achievement({ children, className }: AchievementProps) {
  return (
    <li
      className={cn(
        "pmdxjs-achievement ml-4 list-disc text-sm text-foreground",
        className,
      )}
    >
      {children}
    </li>
  );
}
