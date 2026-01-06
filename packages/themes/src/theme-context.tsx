"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { DEFAULT_THEME, THEMES, type Theme } from "./types";
import { loadTheme, switchTheme } from "./theme-loader";

const STORAGE_KEY = "sbozh-theme";

interface ThemeContextValue {
  theme: Theme;
  themeId: string;
  setTheme: (themeId: string) => void;
  availableThemes: Theme[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getStoredTheme(): string {
  if (typeof window === "undefined") return DEFAULT_THEME;
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME;
}

function storeTheme(themeId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, themeId);
}

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = DEFAULT_THEME,
}: ThemeProviderProps) {
  const [themeId, setThemeId] = useState(defaultTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = getStoredTheme();
    setThemeId(stored);
    loadTheme(stored);
    setMounted(true);
  }, []);

  const setTheme = useCallback(
    (newThemeId: string) => {
      const theme = THEMES.find((t) => t.id === newThemeId);
      if (!theme) {
        console.warn(`Theme "${newThemeId}" not found`);
        return;
      }

      switchTheme(themeId, newThemeId);
      storeTheme(newThemeId);
      setThemeId(newThemeId);
    },
    [themeId]
  );

  const theme = THEMES.find((t) => t.id === themeId) || THEMES[0];

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <ThemeContext.Provider
        value={{
          theme: THEMES.find((t) => t.id === defaultTheme) || THEMES[0],
          themeId: defaultTheme,
          setTheme: () => {},
          availableThemes: THEMES,
        }}
      >
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeId,
        setTheme,
        availableThemes: THEMES,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
