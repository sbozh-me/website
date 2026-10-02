"use client";

import { useEffect } from "react";

import { Button } from "@sbozh/react-ui/components/ui/button";
import { STILL_THEME, setReaderTheme, useStillTheme } from "@sbozh/themes";

/**
 * Header switch between the dark site and Roman White, remembered across visits.
 * `?theme=roman-white` does the same from a link (see readerThemeScript).
 */
export function ReaderThemeToggle({ className = "" }: { className?: string }) {
  const white = useStillTheme();

  return (
    <Button
      type="button"
      variant="outline"
      aria-pressed={white}
      aria-label={white ? "Switch to the dark theme" : "Switch to the white reading theme"}
      className={`reader-theme-toggle h-11 min-w-11 border-primary text-foreground hover:bg-primary/10 ${className}`}
      onClick={() => setReaderTheme(white ? null : STILL_THEME)}
    >
      {white ? <MoonIcon /> : <SunIcon />}
      {white ? "Dark" : "White"}
    </Button>
  );
}

const CYRILLIC = /[Ѐ-ӿ]/;

/** Marks one h1/h2 for the Cyrillic-capable caps face. */
function markHeading(heading: Element) {
  if (CYRILLIC.test(heading.textContent ?? "")) heading.setAttribute("data-script", "cyrillic");
  else heading.removeAttribute("data-script");
}

/**
 * Cinzel has no Cyrillic, so in Roman White a heading with any Cyrillic in it switches
 * whole to Forum (no heading mixes two faces). Watches the page for headings that client
 * navigation brings in. Only runs while Roman White is on.
 */
export function CyrillicHeadings() {
  const white = useStillTheme();

  useEffect(() => {
    if (!white) return;
    const markAll = () => document.querySelectorAll("h1, h2").forEach(markHeading);
    markAll();
    let frame = 0;
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(markAll);
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [white]);

  return null;
}

function SunIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  );
}
