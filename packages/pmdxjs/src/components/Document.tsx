"use client";

import { cn } from "../lib/utils";
import { DocumentContext } from "../transformer/context";
import { DEFAULT_CONFIG } from "../types/config";

import type { DocumentConfig } from "../types/config";
import type { ReactNode } from "react";

export interface DocumentProps {
  config?: Partial<DocumentConfig>;
  children: ReactNode;
  className?: string;
}

/**
 * Document component - root wrapper for PMDXJS documents
 *
 * Provides document configuration context and applies format-specific styling.
 */
export function Document({
  config: configOverride,
  children,
  className,
}: DocumentProps) {
  const config: DocumentConfig = {
    ...DEFAULT_CONFIG,
    ...configOverride,
  };

  return (
    <DocumentContext.Provider value={{ config }}>
      <div
        className={cn(
          "pmdxjs-document",
          className,
        )}
        data-format={config.format}
        data-theme={config.theme}
      >
        {children}
      </div>
    </DocumentContext.Provider>
  );
}
