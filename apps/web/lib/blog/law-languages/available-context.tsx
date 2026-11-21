"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * The languages the current law actually contains. The switcher and the blocks both read
 * this, so an empty block never renders and a stored choice outside the set falls back to
 * the first available one.
 */
const LawAvailableContext = createContext<readonly string[]>([]);

export function LawAvailableProvider({
  languages,
  children,
}: {
  readonly languages: readonly string[];
  readonly children: ReactNode;
}) {
  return (
    <LawAvailableContext.Provider value={languages}>{children}</LawAvailableContext.Provider>
  );
}

export function useLawAvailable(): readonly string[] {
  return useContext(LawAvailableContext);
}
