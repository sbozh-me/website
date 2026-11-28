"use client";

import { useEffect, useSyncExternalStore } from "react";

/**
 * A reader's choice that every block on the page and the switcher above it share (which
 * language a law shows, which AI variant a post shows). One module-level state per store,
 * so the blocks and the switcher agree without a Context wrapper on the server.
 *
 * The choice lives in localStorage; the server renders with the fallback (or the page's
 * `initial`, e.g. from the URL) and the first client effect reconciles.
 */
export interface ChoiceStore<T extends string> {
  /** The reader picked one: state, storage, and every subscriber re-renders. */
  set(value: T): void;
  /**
   * The page asks for one (a URL parameter). Safe to call while rendering: it sets the
   * state for the components that render after it, and remembers it, without notifying.
   */
  seed(value: T): void;
  /** The remembered choice, if the reader has one. */
  stored(): T | null;
  /** The current choice. With `initial` the page was asked for one: storage doesn't override it. */
  use(initial?: T): T;
}

export function createChoiceStore<T extends string>({
  storageKey,
  fallback,
  isValid,
}: {
  readonly storageKey: string;
  readonly fallback: T;
  readonly isValid: (value: string) => value is T;
}): ChoiceStore<T> {
  let active: T = fallback;
  const listeners = new Set<() => void>();

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => void listeners.delete(listener);
  };
  const notify = () => listeners.forEach((listener) => listener());

  const stored = (): T | null => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      return raw && isValid(raw) ? raw : null;
    } catch {
      return null;
    }
  };

  const remember = (value: T) => {
    try {
      window.localStorage.setItem(storageKey, value);
    } catch {
      /* storage can throw in private mode; the in-memory state is still enough */
    }
  };

  return {
    set(value) {
      if (active === value) return;
      active = value;
      remember(value);
      notify();
    },
    seed(value) {
      // On the server the module state is shared by every request: never touch it there
      if (typeof window === "undefined") return;
      active = value;
      remember(value);
    },
    stored,
    use(initial) {
      const value = useSyncExternalStore(
        subscribe,
        () => active,
        () => initial ?? fallback,
      );
      useEffect(() => {
        if (initial) return;
        const saved = stored();
        if (saved && saved !== active) {
          active = saved;
          notify();
        }
      }, [initial]);
      return value;
    },
  };
}

/**
 * What a post actually shows: the reader's choice when the post has it, otherwise the
 * first option the post contains.
 */
export function effectiveChoice(active: string, available: readonly string[]): string | undefined {
  return available.includes(active) ? active : available[0];
}
