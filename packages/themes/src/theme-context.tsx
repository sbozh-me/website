"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  type ReactNode,
} from "react";
import { currentReaderTheme, useReaderTheme } from "./reader-theme";
import { DEFAULT_THEME, THEMES, type Theme } from "./types";

interface ThemeContextValue {
  theme: Theme;
  themeId: string;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  theme: string;
  fallback?: string;
  children: ReactNode;
}

/**
 * Controlled theme provider that applies a theme based on prop.
 * If the theme doesn't exist in the registry, falls back to the fallback theme.
 */
export function ThemeProvider({
  theme,
  fallback = DEFAULT_THEME,
  children,
}: ThemeProviderProps) {
  const resolvedTheme = useMemo(() => {
    const exists = THEMES.some((t) => t.id === theme);
    return exists ? theme : fallback;
  }, [theme, fallback]);

  // Note: data-theme attribute is now set directly on <html> in layout.tsx
  // PageTheme component can override it for per-page theming

  const value = useMemo(
    () => ({
      themeId: resolvedTheme,
      theme: THEMES.find((t) => t.id === resolvedTheme) || THEMES[0],
    }),
    [resolvedTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

interface PageThemeProps {
  theme: string;
}

// SSR-safe useLayoutEffect
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Client component that overrides the page theme.
 * Sets data-theme on mount, resets on unmount to the reader's choice or the default.
 * A reader's saved choice (header switch, ?theme= link) always wins over the page's.
 * Use in pages that need a different theme than the layout default.
 */
export function PageTheme({ theme }: PageThemeProps) {
  // Re-applies when the reader switches, e.g. back to dark on a KOGNITIV post
  const readerTheme = useReaderTheme();

  // Use layout effect to set theme before paint, avoiding flash
  useIsomorphicLayoutEffect(() => {
    const resolvedTheme = THEMES.some((t) => t.id === theme)
      ? theme
      : DEFAULT_THEME;

    if (!currentReaderTheme()) document.documentElement.setAttribute("data-theme", resolvedTheme);

    return () => {
      document.documentElement.setAttribute("data-theme", currentReaderTheme() ?? DEFAULT_THEME);
    };
  }, [theme, readerTheme]);

  return null;
}
