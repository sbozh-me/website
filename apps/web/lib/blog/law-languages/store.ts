"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  DEFAULT_LAW_LANGUAGE,
  LAW_LANGUAGE_STORAGE_KEY,
  isLawLanguage,
  type LawLanguageCode,
} from "./languages";

/**
 * Shared store for which language a Law-type post shows. One module-level state so every
 * LawLanguageBlock on the page and the switcher agree without a Context wrapper on the
 * server.
 *
 * The reader's choice lives in localStorage; the server renders with the default (cs) and
 * the first client effect reconciles.
 */

let active: LawLanguageCode = DEFAULT_LAW_LANGUAGE;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

function notify() {
  listeners.forEach((listener) => listener());
}

export function setLawLanguage(code: LawLanguageCode) {
  if (active === code) return;
  active = code;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(LAW_LANGUAGE_STORAGE_KEY, code);
    } catch {
      /* storage can throw in private mode; the in-memory state is still enough */
    }
  }
  notify();
}

function readStored(): LawLanguageCode | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LAW_LANGUAGE_STORAGE_KEY);
    return raw && isLawLanguage(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function useLawLanguage(): LawLanguageCode {
  const snapshot = () => active;
  const serverSnapshot = () => DEFAULT_LAW_LANGUAGE;
  const value = useSyncExternalStore(subscribe, snapshot, serverSnapshot);

  useEffect(() => {
    const stored = readStored();
    if (stored && stored !== active) {
      active = stored;
      notify();
    }
  }, []);

  return value;
}
