"use client";

import { Maximize, Minimize } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { Button } from "@sbozh/react-ui/components/ui/button";

/** Two taps within this many ms (and close together) count as a double tap. */
export const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_PX = 30;

interface IOSVideo extends HTMLVideoElement {
  webkitEnterFullscreen?: () => void;
}

/**
 * Fullscreen for a post's video frame: a corner button, a double click (mouse) or a double
 * tap (touch). The whole frame goes fullscreen, so a <WindowVideo> keeps switching cuts
 * with the W key. iPhone Safari can't fullscreen an element, only a <video>, so there the
 * visible video goes fullscreen natively instead.
 */
export function FullscreenFrame({
  className,
  children,
  ...data
}: {
  className: string;
  children: ReactNode;
  [data: `data-${string}`]: string | undefined;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const lastTap = useRef<{ time: number; x: number; y: number } | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const update = () => setActive(!!frame.current && document.fullscreenElement === frame.current);
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);

  const toggle = useCallback(() => {
    const element = frame.current;
    if (!element) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.()?.catch(() => {});
    } else if (element.requestFullscreen) {
      element.requestFullscreen().catch(() => {});
    } else {
      const video = element.querySelector<IOSVideo>("video:not([hidden])");
      video?.webkitEnterFullscreen?.();
    }
  }, []);

  return (
    <div
      ref={frame}
      className={className}
      data-fullscreen={active ? "" : undefined}
      {...data}
      onDoubleClick={(event) => {
        if ((event.target as HTMLElement).closest("button")) return;
        toggle();
      }}
      onPointerUp={(event) => {
        // Touch browsers don't reliably send dblclick, so count the taps ourselves
        if (event.pointerType !== "touch" || (event.target as HTMLElement).closest("button")) return;
        const tap = { time: event.timeStamp, x: event.clientX, y: event.clientY };
        const last = lastTap.current;
        if (
          last &&
          tap.time - last.time < DOUBLE_TAP_MS &&
          Math.hypot(tap.x - last.x, tap.y - last.y) < DOUBLE_TAP_PX
        ) {
          lastTap.current = null;
          event.preventDefault();
          toggle();
        } else {
          lastTap.current = tap;
        }
      }}
    >
      {children}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="video-fullscreen-button"
        aria-label={active ? "Exit fullscreen" : "Fullscreen"}
        onClick={toggle}
      >
        {active ? <Minimize /> : <Maximize />}
      </Button>
    </div>
  );
}
