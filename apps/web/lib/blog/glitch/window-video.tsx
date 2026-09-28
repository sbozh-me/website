"use client";

import { useEffect, useRef } from "react";

import { useGlitchesEnabled } from "./window";
import "./glitch.css";

interface WindowVideoProps {
  /** Video shown while the window is open (ON). */
  on: string;
  /** Video shown while the window is closed (OFF). */
  off: string;
  onPoster?: string;
  offPoster?: string;
  /** Accessible name for the videos. */
  title?: string;
  /** Set by remark-glitch on a `==WINDOW OFF==` page so the server renders the OFF video. */
  windowOff?: boolean;
}

/**
 * Two cuts of the same loop, switched by the page's window (button or W key):
 *
 *   <WindowVideo on="/api/assets/<id>" off="/api/assets/<id>" />
 *
 * Both stay mounted; the hidden one is paused. The cuts share their footage timeline, so
 * the one coming in picks up at the other's timestamp and only the captions change.
 */
export function WindowVideo({ on, off, onPoster, offPoster, title, windowOff = false }: WindowVideoProps) {
  const open = useGlitchesEnabled(windowOff);
  const onRef = useRef<HTMLVideoElement>(null);
  const offRef = useRef<HTMLVideoElement>(null);
  const first = useRef(true);

  useEffect(() => {
    const [shown, hidden] = open ? [onRef.current, offRef.current] : [offRef.current, onRef.current];
    if (!shown || !hidden) return;
    hidden.pause();
    // Skip the sync on mount: autoPlay already started the right one from the beginning
    if (!first.current && Number.isFinite(hidden.currentTime)) shown.currentTime = hidden.currentTime;
    first.current = false;
    shown.play()?.catch(() => {
      // Autoplay can be refused (e.g. data saver); the poster and controls-free frame stay
    });
  }, [open]);

  const video = (src: string, poster: string | undefined, active: boolean, ref: typeof onRef) => (
    <video
      ref={ref}
      src={src}
      poster={poster}
      hidden={!active}
      autoPlay={active}
      preload={active ? "auto" : "metadata"}
      loop
      muted
      playsInline
      aria-label={title}
    />
  );

  return (
    <div className="window-video" data-window={open ? "on" : "off"}>
      {video(on, onPoster, open, onRef)}
      {video(off, offPoster, !open, offRef)}
    </div>
  );
}
