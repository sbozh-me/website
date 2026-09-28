"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Button } from "@sbozh/react-ui/components/ui/button";

/*
 * The "window" (форточка): one page-wide switch for the glitch effects. With the window
 * OFF, glitch words render as plain article text and nothing bursts. It lives only as long
 * as the page's WindowToggle, so a post without the button always glitches.
 */

let enabled = true;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

export function setGlitchesEnabled(value: boolean) {
  if (enabled === value) return;
  enabled = value;
  listeners.forEach((listener) => listener());
}

export function useGlitchesEnabled() {
  return useSyncExternalStore(
    subscribe,
    () => enabled,
    () => true,
  );
}

/** `==WINDOW==` in a post: "Window ON" / "Window OFF". */
export function WindowToggle() {
  const on = useGlitchesEnabled();

  // Leaving the page opens the window again for the next post
  useEffect(() => () => setGlitchesEnabled(true), []);

  return (
    <Button
      variant="outline"
      size="sm"
      aria-pressed={on}
      className="window-toggle mx-1 align-middle font-mono"
      onClick={() => setGlitchesEnabled(!on)}
    >
      {on ? "Window ON" : "Window OFF"}
    </Button>
  );
}
