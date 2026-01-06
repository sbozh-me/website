import { THEMES, type Theme } from "./types";

const LINK_ID_PREFIX = "theme-css-";
const loadedThemes = new Set<string>();

export function getThemeById(themeId: string): Theme | undefined {
  return THEMES.find((t) => t.id === themeId);
}

export function isThemeLoaded(themeId: string): boolean {
  return loadedThemes.has(themeId);
}

export function getThemeCssPath(themeId: string): string {
  return `@sbozh/themes/${themeId}`;
}

export function loadTheme(themeId: string): void {
  if (typeof document === "undefined") return;
  if (loadedThemes.has(themeId)) return;

  const theme = getThemeById(themeId);
  if (!theme) {
    console.warn(`Theme "${themeId}" not found`);
    return;
  }

  // Mark as loaded - actual CSS is imported statically or via bundler
  loadedThemes.add(themeId);
  document.documentElement.setAttribute("data-theme", themeId);
}

export function unloadTheme(themeId: string): void {
  if (typeof document === "undefined") return;

  const linkId = `${LINK_ID_PREFIX}${themeId}`;
  const existingLink = document.getElementById(linkId);

  if (existingLink) {
    existingLink.remove();
  }

  loadedThemes.delete(themeId);

  if (document.documentElement.getAttribute("data-theme") === themeId) {
    document.documentElement.removeAttribute("data-theme");
  }
}

export function switchTheme(fromThemeId: string, toThemeId: string): void {
  if (fromThemeId !== toThemeId) {
    unloadTheme(fromThemeId);
  }
  loadTheme(toThemeId);
}
