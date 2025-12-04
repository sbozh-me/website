"use client";

import { cn } from "../../lib/utils";

export interface WatermarkProps {
  text?: string;
  className?: string;
}

/**
 * CV Watermark component - footer watermark for print
 */
export function Watermark({
  text = "Generated with PMDXJS",
  className,
}: WatermarkProps) {
  return (
    <div
      className={cn(
        "pmdxjs-watermark mt-auto pt-4 text-center text-xs text-muted-foreground/50",
        className,
      )}
    >
      {text}
    </div>
  );
}
