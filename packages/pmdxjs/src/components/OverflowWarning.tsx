"use client";

import { useRef } from "react";

import { usePageOverflow } from "../hooks/usePageOverflow";
import { cn } from "../lib/utils";

import type { PageOverflowResult } from "../hooks/usePageOverflow";
import type { ReactNode } from "react";

export interface OverflowWarningProps {
  children: ReactNode;
  /** Enable overflow detection (default: true in development) */
  enabled?: boolean;
  /** Custom class name for the wrapper */
  className?: string;
  /** Callback when overflow status changes */
  onOverflowChange?: (result: PageOverflowResult) => void;
  /** Dependencies to trigger re-check */
  deps?: unknown[];
}

/**
 * Wrapper component that detects and displays page overflow warnings
 *
 * Shows a developer-friendly message indicating which elements overflow
 * and suggestions for fixing them.
 */
export function OverflowWarning({
  children,
  enabled = process.env.NODE_ENV === "development",
  className,
  onOverflowChange,
  deps = [],
}: OverflowWarningProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const result = usePageOverflow(containerRef, deps);

  // Call callback when result changes
  if (onOverflowChange && result.elements.length > 0) {
    onOverflowChange(result);
  }

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <div className={cn("relative", className)}>
      {!result.fits && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          <div className="mb-2 flex items-center gap-2 font-semibold">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            Page Overflow Detected
          </div>
          <div className="space-y-2">
            {result.elements.slice(0, 5).map((el, i) => {
              const arrow =
                el.direction === "bottom"
                  ? "↓"
                  : el.direction === "right"
                    ? "→"
                    : "←";
              const directionLabel =
                el.direction === "bottom" ? "vertical" : "horizontal";
              return (
                <div key={i} className="rounded bg-red-100 p-2">
                  <div className="font-medium">
                    <span className="mr-1">{arrow}</span>
                    {el.name}{" "}
                    <span className="text-red-600">
                      ({el.overflowPx}px {directionLabel})
                    </span>
                  </div>
                  <div className="text-red-700">{el.suggestion}</div>
                </div>
              );
            })}
            {result.elements.length > 5 && (
              <div className="text-red-600">
                ...and {result.elements.length - 5} more overflowing element(s)
              </div>
            )}
          </div>
          <div className="mt-3 text-xs text-red-600">
            Max overflow: {result.totalOverflowPx}px
          </div>
        </div>
      )}
      <div ref={containerRef}>{children}</div>
    </div>
  );
}
