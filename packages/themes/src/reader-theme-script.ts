import { DEFAULT_THEME } from "./types";

/** Where the reader's choice is saved (see reader-theme.ts). */
export const READER_THEME_KEY = "sbozh-reader-theme";

/** Themes a reader can pick; the first is the default (no saved choice). */
export const READER_THEMES = [DEFAULT_THEME, "roman-white"] as const;

/** The light reading theme: the same words, held still. */
export const STILL_THEME = "roman-white";

/**
 * Runs before first paint (inlined into <head>, so it must not reference anything outside
 * itself). `?theme=<id>` sets and saves a choice, so one link is enough; otherwise the
 * saved choice is applied.
 */
export function initReaderTheme(key: string, themes: readonly string[], fallback: string) {
  let choice: string | null = null;
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("theme");
    if (fromUrl && themes.indexOf(fromUrl) !== -1) {
      if (fromUrl === fallback) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, fromUrl);
    }
    choice = fromUrl && themes.indexOf(fromUrl) !== -1 ? fromUrl : window.localStorage.getItem(key);
  } catch {
    // Storage blocked: the default theme stays
  }
  if (!choice || themes.indexOf(choice) === -1 || choice === fallback) choice = null;
  const root = document.documentElement;
  root.dataset.readerTheme = choice || "";
  if (choice) root.setAttribute("data-theme", choice);
}

/** The inline <script> body for the root layout's <head>. */
export const readerThemeScript = `(${initReaderTheme.toString()})(${JSON.stringify(READER_THEME_KEY)},${JSON.stringify(READER_THEMES)},${JSON.stringify(DEFAULT_THEME)})`;
