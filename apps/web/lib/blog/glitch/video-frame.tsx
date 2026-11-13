"use client";

import { Maximize, Minimize, Play, Volume1, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { Button } from "@sbozh/react-ui/components/ui/button";
import { Slider } from "@sbozh/react-ui/components/ui/slider";

/** Two taps within this many ms (and close together) count as a double tap. */
export const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_PX = 30;

interface IOSVideo extends HTMLVideoElement {
  webkitEnterFullscreen?: () => void;
}

const visibleVideo = (frame: HTMLElement) => frame.querySelector<IOSVideo>("video:not([hidden])");

/** Clicks on the controls don't pause the video or go fullscreen. */
const onControls = (target: EventTarget) => !!(target as HTMLElement).closest?.(".video-controls");

/**
 * Controls for a post's video frame.
 *
 * Play: a click (or tap) on the video pauses it and shows a play mark; another resumes it.
 * While the reader has it paused the frame carries `data-paused`, so a <WindowVideo> doesn't
 * restart it when the window switches cuts.
 *
 * Sound: videos start muted (browsers only autoplay silent video). The speaker button
 * unmutes every video in the frame, so a <WindowVideo> keeps its sound across ON/OFF; with
 * a mouse, hovering it opens a vertical volume slider. (iPhones ignore page volume, so
 * touch screens only get the button.)
 *
 * Fullscreen: a corner button, a double click (mouse) or a double tap (touch). The whole
 * frame goes fullscreen, so a <WindowVideo> keeps switching cuts with the W key. iPhone
 * Safari can't fullscreen an element, only a <video>, so there the visible video goes
 * fullscreen natively instead.
 */
export function VideoFrame({
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
  const [fullscreen, setFullscreen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    const update = () => setFullscreen(!!frame.current && document.fullscreenElement === frame.current);
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const element = frame.current;
    if (!element) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.()?.catch(() => {});
    } else if (element.requestFullscreen) {
      element.requestFullscreen().catch(() => {});
    } else {
      visibleVideo(element)?.webkitEnterFullscreen?.();
    }
  }, []);

  const togglePlay = useCallback(() => {
    const video = frame.current && visibleVideo(frame.current);
    if (!video) return;
    if (video.paused) {
      video.play()?.catch(() => {});
      setPaused(false);
    } else {
      video.pause();
      setPaused(true);
    }
  }, []);

  const applySound = useCallback(
    (nextMuted: boolean, nextVolume: number) => {
      const element = frame.current;
      if (!element) return;
      for (const video of element.querySelectorAll("video")) {
        video.muted = nextMuted;
        video.volume = nextVolume;
      }
      if (!nextMuted && !paused) {
        // A click is a user gesture, so this also starts a video whose autoplay was refused
        visibleVideo(element)?.play()?.catch(() => {});
      }
      setMuted(nextMuted);
      setVolume(nextVolume);
    },
    [paused],
  );

  const toggleSound = () => (muted ? applySound(false, volume || 1) : applySound(true, volume));

  const level = muted ? 0 : volume;
  const SoundIcon = level === 0 ? VolumeX : level < 0.5 ? Volume1 : Volume2;

  return (
    <div
      ref={frame}
      className={className}
      data-fullscreen={fullscreen ? "" : undefined}
      data-paused={paused ? "" : undefined}
      {...data}
      onClick={(event) => {
        if (!onControls(event.target)) togglePlay();
      }}
      onDoubleClick={(event) => {
        if (!onControls(event.target)) toggleFullscreen();
      }}
      onPointerUp={(event) => {
        // Touch browsers don't reliably send dblclick, so count the taps ourselves
        if (event.pointerType !== "touch" || onControls(event.target)) return;
        const tap = { time: event.timeStamp, x: event.clientX, y: event.clientY };
        const last = lastTap.current;
        if (
          last &&
          tap.time - last.time < DOUBLE_TAP_MS &&
          Math.hypot(tap.x - last.x, tap.y - last.y) < DOUBLE_TAP_PX
        ) {
          lastTap.current = null;
          event.preventDefault();
          toggleFullscreen();
        } else {
          lastTap.current = tap;
        }
      }}
    >
      {children}
      {paused && (
        <span className="video-paused-mark" aria-hidden>
          <Play />
        </span>
      )}
      <div className="video-controls">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={paused ? "Play" : "Pause"}
          className="sr-only focus-visible:not-sr-only"
          onClick={togglePlay}
        >
          <Play />
        </Button>
        <div className="video-volume">
          <div className="video-volume-slider">
            <Slider
              orientation="vertical"
              min={0}
              max={100}
              step={1}
              value={[Math.round(level * 100)]}
              aria-label="Volume"
              onValueChange={([value]) => applySound(value === 0, value === 0 ? volume : value / 100)}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={muted ? "Unmute" : "Mute"}
            aria-pressed={!muted}
            onClick={toggleSound}
          >
            <SoundIcon />
          </Button>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
          onClick={toggleFullscreen}
        >
          {fullscreen ? <Minimize /> : <Maximize />}
        </Button>
      </div>
    </div>
  );
}
