"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
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

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolvedTheme);
  }, [resolvedTheme]);

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
