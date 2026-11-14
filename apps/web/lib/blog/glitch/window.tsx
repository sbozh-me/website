"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Button } from "@sbozh/react-ui/components/ui/button";

import "./glitch.css";

/*
 * The "window" (форточка): one page-wide switch for the glitch effects. With the window
 * OFF, glitch words render as plain article text and nothing bursts. The site header
 * carries its button (and the W hotkey) on every page; posts may add their own.
 *
 * Until the reader clicks, the page's default applies: ON, or OFF when something on the
 * page starts it closed (`==WINDOW OFF==` in a post, Kagurame on the home page). For a
 * post, remark-glitch also marks every glitch word `windowOff`, so the server renders them
 * plain and there's no flash of glitching before hydration. A new page starts over.
 */

/** null = the page's default; a boolean once the reader has clicked. */
let enabled: boolean | null = null;
/** How many things on the page start it with the window closed. */
let closers = 0;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

function notify() {
  listeners.forEach((listener) => listener());
}

export function setGlitchesEnabled(value: boolean | null) {
  if (enabled === value) return;
  enabled = value;
  notify();
}

/** Is the window open: the reader's choice, else the page's default. */
function isOpen(windowOff = false) {
  return enabled ?? !(windowOff || closers > 0);
}

/** `windowOff`: this word starts with the window closed (`==WINDOW OFF==`). */
export function useGlitchesEnabled(windowOff = false) {
  const snapshot = () => isOpen(windowOff);
  // The server knows only the word's own default: the page's closers register in effects
  const serverSnapshot = () => enabled ?? !windowOff;
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}

/** While mounted (and `active`), the page starts with the window closed. */
export function useWindowStartsClosed(active = true) {
  useEffect(() => {
    if (!active) return;
    closers++;
    notify();
    return () => {
      closers--;
      notify();
    };
  }, [active]);
}

// W hotkey: one keydown listener per page, however many toggles it has, so a press
// can't flip the window twice.
let mountedToggles = 0;

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
  setGlitchesEnabled(!isOpen());
}

/** Keeps the W hotkey listening while mounted. */
function useWindowHotkey() {
  useEffect(() => {
    if (mountedToggles++ === 0) window.addEventListener("keydown", onKeyDown);
    return () => {
      if (--mountedToggles === 0) window.removeEventListener("keydown", onKeyDown);
    };
  }, []);
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
export function WindowButton({
  off = false,
  inGlitch = false,
  className = "mx-1",
  labelClassName,
}: {
  off?: boolean;
  inGlitch?: boolean;
  /** Sizing where it sits: inline in text by default, header-sized in the header */
  className?: string;
  /** e.g. visible only on wider screens; the label stays the button's accessible name */
  labelClassName?: string;
}) {
  const on = useGlitchesEnabled(off);
  return (
    <Button
      variant="outline"
      size="sm"
      aria-pressed={on}
      aria-keyshortcuts="W"
      title="Hotkey: W"
      tabIndex={inGlitch ? -1 : undefined}
      // Its label flips on every toggle; kept away from page translators (see Glitch)
      translate="no"
      className={`window-toggle notranslate align-middle font-mono ${className}`}
      onClick={() => setGlitchesEnabled(!on)}
    >
      <WindowIcon open={on} />
      <span className={labelClassName}>{on ? "Window ON" : "Window OFF"}</span>
    </Button>
  );
}

/**
 * `==WINDOW==` in a post: "Window ON" / "Window OFF", also toggled with the W key.
 * `==WINDOW OFF==` (`off`) starts the page with the window closed, so the reader
 * switches the glitches on.
 */
export function WindowToggle({ off = false }: { off?: boolean }) {
  useWindowStartsClosed(off);
  useWindowHotkey();
  // Leaving the page goes back to the default for the next post
  useEffect(() => () => setGlitchesEnabled(null), []);

  return <WindowButton off={off} />;
}

/**
 * The site header's button: the page's window on every page, with the W hotkey. It stays
 * mounted across pages, so `page` (the pathname) starts each new page at its own default.
 */
export function HeaderWindowToggle({ page }: { page: string | null }) {
  useWindowHotkey();
  useEffect(() => setGlitchesEnabled(null), [page]);

  // Icon only on phones, where the header has no room for the label
  return (
    <WindowButton
      className="size-[44px] px-0 has-[>svg]:px-0 md:h-11 md:w-auto md:px-3 md:has-[>svg]:px-2.5"
      labelClassName="sr-only md:not-sr-only"
    />
  );
}
