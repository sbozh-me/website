"use client";

import { cn } from "../../lib/utils";

export interface LanguageItem {
  language: string;
  level: string;
}

export interface LanguagesProps {
  items: LanguageItem[];
  className?: string;
}

/**
 * CV Languages component - language proficiency list
 */
export function Languages({ items, className }: LanguagesProps) {
  return (
    <div className={cn("pmdxjs-languages space-y-1", className)}>
      {items.map((item, i) => (
        <div key={i} className="flex justify-between text-sm">
          <span>{item.language}</span>
          <span className="text-muted-foreground">{item.level}</span>
        </div>
      ))}
    </div>
  );
}
