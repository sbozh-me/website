"use client";

import { cn } from "../lib/utils";
import { useDocumentConfig } from "../transformer/context";

import type { ReactNode } from "react";

export interface PageProps {
  children: ReactNode;
  className?: string;
}

/**
 * Page dimensions in mm
 */
const PAGE_SIZES = {
  A4: { width: 210, height: 297 },
  Letter: { width: 215.9, height: 279.4 },
} as const;

/**
 * Page component - represents a single page in the document
 *
 * Applies page sizing based on format (A4/Letter) and margins from config.
 */
export function Page({ children, className }: PageProps) {
  const config = useDocumentConfig();
  const size = PAGE_SIZES[config.format];
  const [marginTop, marginRight, marginBottom, marginLeft] = config.margins;

  return (
    <div
      className={cn(
        "pmdxjs-page",
        "relative",
        "bg-white",
        "mx-auto mb-8 last:mb-0",
        "shadow-lg print:shadow-none",
        "break-after-page",
        "rounded-sm",
        className,
      )}
      style={{
        width: `${size.width}mm`,
        minHeight: `${size.height}mm`,
        padding: `${marginTop}mm ${marginRight}mm ${marginBottom}mm ${marginLeft}mm`,
      }}
    >
      {children}
    </div>
  );
}
