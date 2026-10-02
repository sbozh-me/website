"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Button } from "@sbozh/react-ui/components/ui/button";
import { useStillTheme } from "@sbozh/themes";

import "./glitch.css";

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

/**
 * `windowOff`: the page starts with the window closed (`==WINDOW OFF==`).
 * Roman White keeps the window shut: every word plain and still, whatever was clicked.
 */
export function useGlitchesEnabled(windowOff = false) {
  const snapshot = () => enabled ?? !windowOff;
  const open = useSyncExternalStore(subscribe, snapshot, snapshot);
  const still = useStillTheme();
  return open && !still;
}

// W hotkey: one keydown listener per page, however many toggles it has, so a press
// can't flip the window twice.
let mountedToggles = 0;
let pageStartsOff = false;

function isTyping(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

function onKeyDown(event: KeyboardEvent) {
  // event.code is the physical key: W on a Latin layout, Ц on a Cyrillic one
  if (event.code !== "KeyW" || event.repeat || event.defaultPrevented) return;
  if (event.ctrlKey || event.metaKey || event.altKey || isTyping(event.target)) return;
  setGlitchesEnabled(!(enabled ?? !pageStartsOff));
}

/**
 * A four-pane window in lucide's line style. Open: the top-left pane (the форточка)
 * swings out on its left hinge.
 */
function WindowIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      data-open={open ? "" : undefined}
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M12 3v18M3 12h18" />
      {open && <path d="M3 3l6-2v9l-6 2z" fill="currentColor" fillOpacity={0.25} />}
    </svg>
  );
}

/**
 * The "Window ON/OFF" button alone: shows and flips the page's window, nothing else.
 * `==a|WINDOW==` flashes one inside a glitch word; it mounts and unmounts with every
 * burst, so it must not own the hotkey or reset the window like WindowToggle does.
 * `inGlitch`: kept out of the tab order (the glitch layers are aria-hidden; W and the
 * page's own toggle stay the keyboard way in).
 */
export function WindowButton({ off = false, inGlitch = false }: { off?: boolean; inGlitch?: boolean }) {
  const on = useGlitchesEnabled(off);
  const still = useStillTheme();
  // Nothing to open in Roman White
  if (still) return null;
  return (
    <Button
      variant="outline"
      size="sm"
      aria-pressed={on}
      aria-keyshortcuts="W"
      title="Hotkey: W"
      tabIndex={inGlitch ? -1 : undefined}
      className="window-toggle mx-1 align-middle font-mono"
      onClick={() => setGlitchesEnabled(!on)}
    >
      <WindowIcon open={on} />
      {on ? "Window ON" : "Window OFF"}
    </Button>
  );
}

/**
 * `==WINDOW==` in a post: "Window ON" / "Window OFF", also toggled with the W key.
 * `==WINDOW OFF==` (`off`) starts the page with the window closed, so the reader
 * switches the glitches on.
 */
export function WindowToggle({ off = false }: { off?: boolean }) {
  useEffect(() => {
    if (off) pageStartsOff = true;
    if (mountedToggles++ === 0) window.addEventListener("keydown", onKeyDown);
    return () => {
      if (--mountedToggles === 0) {
        window.removeEventListener("keydown", onKeyDown);
        pageStartsOff = false;
      }
      // Leaving the page goes back to the default for the next post
      setGlitchesEnabled(null);
    };
  }, [off]);

  return <WindowButton off={off} />;
}
