"use client";

import { createContext, useContext } from "react";

import { DEFAULT_CONFIG } from "../types/config";

import type { DocumentConfig } from "../types/config";

/**
 * Document context for passing config down the component tree
 */
export interface DocumentContextValue {
  config: DocumentConfig;
}

export const DocumentContext = createContext<DocumentContextValue>({
  config: DEFAULT_CONFIG,
});

/**
 * Hook to access document configuration
 */
export function useDocumentConfig(): DocumentConfig {
  const context = useContext(DocumentContext);
  return context.config;
}
