"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

import { useStillTheme } from "@sbozh/themes";

import { useGlitchesEnabled } from "./window";
import "./glitch.css";

interface WindowVideoProps {
  /** Video shown while the window is open (ON). */
  on: string;
  /** Video shown while the window is closed (OFF). */
  off: string;
  onPoster?: string;
  offPoster?: string;
  /** Optional mobile cuts (e.g. vertical Shorts), used below the md breakpoint. */
  mobileOn?: string;
  mobileOff?: string;
  mobileOnPoster?: string;
  mobileOffPoster?: string;
  /** Accessible name for the videos. */
  title?: string;
  /** Set by remark-glitch on a `==WINDOW OFF==` page so the server renders the OFF video. */
  windowOff?: boolean;
}

/** Tailwind's md breakpoint: below it the mobile cuts play. */
export const MOBILE_QUERY = "(max-width: 767px)";

function subscribeMobile(onChange: () => void) {
  const query = window.matchMedia?.(MOBILE_QUERY);
  query?.addEventListener("change", onChange);
  return () => query?.removeEventListener("change", onChange);
}

/** Server and first paint: desktop. Only the poster depends on it; the <source media> picks the file. */
function useIsMobile() {
  return useSyncExternalStore(
    subscribeMobile,
    () => window.matchMedia?.(MOBILE_QUERY).matches ?? false,
    () => false,
  );
}

/**
 * Two cuts of the same loop, switched by the page's window (button or W key):
 *
 *   <WindowVideo on="/api/assets/<id>" off="/api/assets/<id>" />
 *
 * Both stay mounted; the hidden one is paused. The cuts share their footage timeline, so
 * the one coming in picks up at the other's timestamp and only the captions change.
 *
 * With `mobileOn` / `mobileOff` (e.g. vertical Shorts cuts), phones get those instead. The
 * browser picks the file from <source media> when it loads, so a phone never downloads the
 * desktop cut; each pair must share its own timeline for the ON/OFF sync.
 */
export function WindowVideo({
  on,
  off,
  onPoster,
  offPoster,
  mobileOn,
  mobileOff,
  mobileOnPoster,
  mobileOffPoster,
  title,
  windowOff = false,
}: WindowVideoProps) {
  const open = useGlitchesEnabled(windowOff);
  const mobile = useIsMobile();
  // Roman White: the closed-window cut, paused until the reader presses play
  const still = useStillTheme();
  const onRef = useRef<HTMLVideoElement>(null);
  const offRef = useRef<HTMLVideoElement>(null);
  const first = useRef(true);

  useEffect(() => {
    const [shown, hidden] = open ? [onRef.current, offRef.current] : [offRef.current, onRef.current];
    if (!shown || !hidden) return;
    hidden.pause();
    if (still) {
      shown.pause();
      return;
    }
    // Skip the sync on mount: autoPlay already started the right one from the beginning
    if (!first.current && Number.isFinite(hidden.currentTime)) shown.currentTime = hidden.currentTime;
    first.current = false;
    shown.play()?.catch(() => {
      // Autoplay can be refused (e.g. data saver); the poster and controls-free frame stay
    });
  }, [open, still]);

  const video = (
    src: string,
    poster: string | undefined,
    mobileSrc: string | undefined,
    mobilePoster: string | undefined,
    active: boolean,
    ref: typeof onRef,
  ) => (
    <video
      ref={ref}
      src={mobileSrc ? undefined : src}
      poster={(mobile && mobilePoster) || poster}
      hidden={!active}
      autoPlay={active && !still}
      controls={still}
      preload={active ? "auto" : "metadata"}
      loop
      muted
      playsInline
      aria-label={title}
    >
      {mobileSrc && (
        <>
          <source src={mobileSrc} media={MOBILE_QUERY} />
          <source src={src} />
        </>
      )}
    </video>
  );

  return (
    <div className="window-video" data-window={open ? "on" : "off"}>
      {video(on, onPoster, mobileOn, mobileOnPoster, open, onRef)}
      {video(off, offPoster, mobileOff, mobileOffPoster, !open, offRef)}
    </div>
  );
}
