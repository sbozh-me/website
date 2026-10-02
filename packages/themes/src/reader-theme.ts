"use client";

import { useSyncExternalStore } from "react";

import { READER_THEMES, READER_THEME_KEY, STILL_THEME } from "./reader-theme-script";
import { DEFAULT_THEME } from "./types";

/**
 * The reader's own theme choice, which beats a page's or post's theme.
 *
 * Only a non-default choice is saved: switching back to the default clears it, so posts
 * keep their own themes for everyone who hasn't picked one.
 */

/** Reads the saved choice; storage can be missing or throw (private mode, blocked cookies). */
export function getReaderTheme(): string | null {
  try {
    const saved = window.localStorage.getItem(READER_THEME_KEY);
    return saved && (READER_THEMES as readonly string[]).includes(saved) && saved !== DEFAULT_THEME
      ? saved
      : null;
  } catch {
    return null;
  }
}

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === READER_THEME_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Saves the choice (the default clears it) and applies it to the page now. */
export function setReaderTheme(theme: string | null) {
  const choice = theme && theme !== DEFAULT_THEME ? theme : null;
  try {
    if (choice) window.localStorage.setItem(READER_THEME_KEY, choice);
    else window.localStorage.removeItem(READER_THEME_KEY);
  } catch {
    // Not saved, but the page still switches for this visit
  }
  document.documentElement.setAttribute("data-theme", choice ?? DEFAULT_THEME);
  document.documentElement.dataset.readerTheme = choice ?? "";
  listeners.forEach((listener) => listener());
}

/**
 * The reader's choice, or null. The server and the hydration pass see null; the inline
 * script has already applied the theme by then, so only theme-aware components re-render.
 */
export function useReaderTheme(): string | null {
  return useSyncExternalStore(subscribe, currentReaderTheme, () => null);
}

/** True while the still (roman-white) theme is on. */
export function useStillTheme(): boolean {
  return useReaderTheme() === STILL_THEME;
}

/** The choice as applied on <html>, which also covers a choice storage refused to keep. */
export function currentReaderTheme(): string | null {
  const applied = document.documentElement.dataset.readerTheme;
  return applied === undefined ? getReaderTheme() : applied || null;
}
