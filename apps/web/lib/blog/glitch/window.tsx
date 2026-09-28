"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Button } from "@sbozh/react-ui/components/ui/button";

/*
 * The "window" (форточка): one page-wide switch for the glitch effects. With the window
 * OFF, glitch words render as plain article text and nothing bursts. It lives only as long
 * as the page's WindowToggle, so a post without the button always glitches.
 *
 * Until the reader clicks, the page's default applies: ON, or OFF when the post has
 * `==WINDOW OFF==`. remark-glitch then marks every glitch word `windowOff`, so the server
 * renders them plain too and there's no flash of glitching before hydration.
 */

/** null = the page's default; a boolean once the reader has clicked. */
let enabled: boolean | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

export function setGlitchesEnabled(value: boolean | null) {
  if (enabled === value) return;
  enabled = value;
  listeners.forEach((listener) => listener());
}

/** `windowOff`: the page starts with the window closed (`==WINDOW OFF==`). */
export function useGlitchesEnabled(windowOff = false) {
  const snapshot = () => enabled ?? !windowOff;
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

/**
 * `==WINDOW==` in a post: "Window ON" / "Window OFF". `==WINDOW OFF==` (`off`) starts
 * the page with the window closed, so the reader switches the glitches on.
 */
export function WindowToggle({ off = false }: { off?: boolean }) {
  const on = useGlitchesEnabled(off);

  // Leaving the page goes back to the default for the next post
  useEffect(() => () => setGlitchesEnabled(null), []);

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
