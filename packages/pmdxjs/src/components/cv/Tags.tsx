"use client";

import { Tag } from "./Tag";
import { cn } from "../../lib/utils";

export interface TagsProps {
  items: string[];
  className?: string;
}

/**
 * CV Tags component - collection of skill badges
 */
export function Tags({ items, className }: TagsProps) {
  return (
    <div className={cn("pmdxjs-tags flex flex-wrap gap-2", className)}>
      {items.map((item, i) => (
        <Tag key={i}>{item}</Tag>
      ))}
    </div>
  );
}
