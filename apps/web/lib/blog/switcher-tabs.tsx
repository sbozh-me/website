"use client";

import type { ReactNode } from "react";
import { Button } from "@sbozh/react-ui/components/ui/button";
import { cn } from "@sbozh/react-ui/lib/utils";

/** The row above a post's body that holds its switchers (AI variant, law language). */
export function SwitcherBar({ children }: { readonly children: ReactNode }) {
  return (
    <div className="not-prose mb-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-border/60 pb-4">
      {children}
    </div>
  );
}

export interface SwitcherOption {
  readonly code: string;
  /** On the button */
  readonly short: string;
  /** Tooltip */
  readonly label: string;
}

/**
 * One group of buttons in the SwitcherBar. Only the options the post contains are
 * passed in (the `:::*` rule that empty blocks don't claim UI space); a single option
 * still shows so the reader sees what they are reading.
 */
export function SwitcherTabs({
  label,
  options,
  active,
  onSelect,
}: {
  readonly label: string;
  readonly options: readonly SwitcherOption[];
  readonly active: string | undefined;
  readonly onSelect: (code: string) => void;
}) {
  if (options.length === 0) return null;

  return (
    <div role="tablist" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isActive = option.code === active;
        return (
          <Button
            key={option.code}
            type="button"
            role="tab"
            aria-selected={isActive}
            size="sm"
            variant={isActive ? "default" : "outline"}
            onClick={() => onSelect(option.code)}
            className={cn(
              "min-w-[3.5rem] font-mono text-xs tracking-wide",
              !isActive && "text-muted-foreground",
            )}
            title={option.label}
          >
            {option.short}
          </Button>
        );
      })}
    </div>
  );
}
