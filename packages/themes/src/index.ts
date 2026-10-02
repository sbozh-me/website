// Types
export type { Theme, ThemeConfig } from "./types";
export { THEMES, DEFAULT_THEME, themeConfig } from "./types";

// Context
export { ThemeProvider, useTheme, PageTheme } from "./theme-context";

// Reader's own choice (header switch, ?theme= link)
export { currentReaderTheme, getReaderTheme, setReaderTheme, useReaderTheme, useStillTheme } from "./reader-theme";
export {
  READER_THEME_KEY,
  READER_THEMES,
  STILL_THEME,
  initReaderTheme,
  readerThemeScript,
} from "./reader-theme-script";

// Overlay
export { ThemeLoaderOverlay } from "./theme-loader-overlay";

// Loader utilities
export {
  loadTheme,
  unloadTheme,
  switchTheme,
  getThemeById,
  isThemeLoaded,
  getThemeCssPath,
} from "./theme-loader";
