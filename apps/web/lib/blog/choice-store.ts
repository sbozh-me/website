"use client";

import { useEffect, useSyncExternalStore } from "react";

/**
 * A reader's choice that every block on the page and the switcher above it share (which
 * language a law shows, which AI variant a post shows). One module-level state per store,
 * so the blocks and the switcher agree without a Context wrapper on the server.
 *
 * The choice lives in localStorage; the server renders with the fallback and the first
 * client effect reconciles.
 */
export interface ChoiceStore<T extends string> {
  set(value: T): void;
  use(): T;
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

  const readStored = (): T | null => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      return raw && isValid(raw) ? raw : null;
    } catch {
      return null;
    }
  };

  return {
    set(value) {
      if (active === value) return;
      active = value;
      try {
        window.localStorage.setItem(storageKey, value);
      } catch {
        /* storage can throw in private mode; the in-memory state is still enough */
      }
      notify();
    },
    use() {
      const value = useSyncExternalStore(
        subscribe,
        () => active,
        () => fallback,
      );
      useEffect(() => {
        const stored = readStored();
        if (stored && stored !== active) {
          active = stored;
          notify();
        }
      }, []);
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
