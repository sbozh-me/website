"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2, Volume2, VolumeX, X } from "lucide-react";
import { Button } from "@sbozh/react-ui/components/ui/button";
import { HeroLeader } from "@/components/home/HeroLeader";
import { markLeaderShown, wasLeaderShown } from "@/lib/privacy/decision";

// SD landscape cut: small enough for a corner clip, reused when the widget expands to
// fill the viewport
const VIDEO_SRC = "/videos/home/pan-dude-desktop.mp4";
const POSTER_SRC = "/videos/home/pan-dude-poster.jpg";

interface CookieCornerVideoProps {
  /**
   * Called when the visitor clicks the close button: the gate opens the Emperor Cookie
   * modal so they still have to pick a side.
   */
  onClose: () => void;
  /** Called once when the 3-2-1 leader runs out. The gate opens the modal on this. */
  onLeaderDone?: () => void;
  /**
   * Called when Escape skips the 3-2-1 leader. The gate opens the modal unconditionally
   * so a returning dismisser can ask for cookies without waiting out the countdown.
   */
  onLeaderSkip?: () => void;
  /** Keep the widget above the demo-page call bar on phones */
  aboveDemoBar?: boolean;
  /**
   * When false, the video is forced to pause and stays paused. The gate flips this to
   * false while the modal is up: the clip stops as a cue that the visitor has to
   * decide before it plays again.
   */
  shouldPlay?: boolean;
}

/**
 * Picture-in-picture Pan Dude in the bottom-right corner: a 3-2-1 film leader plays
 * over the hero video while it loads, then the video loops. It stays there until the
 * visitor picks a cookie choice.
 *
 * Controls (overlaid, centered at the bottom): mute, full-screen, close. A click on
 * the video pauses or resumes it; the video also pauses when the tab is hidden.
 * Escape shrinks a full-screen widget back to the corner.
 */
export function CookieCornerVideo({
  onClose,
  onLeaderDone,
  onLeaderSkip,
  aboveDemoBar,
  shouldPlay = true,
}: CookieCornerVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // One 3-2-1 per tab session: if the hero already ran it, skip straight to the video
  const [counting, setCounting] = useState(() => !wasLeaderShown());
  const endLeader = useCallback(() => {
    setCounting(false);
    markLeaderShown();
    onLeaderDone?.();
  }, [onLeaderDone]);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // When the leader runs out, start the video (muted so autoplay is allowed). The gate
  // can force a pause (shouldPlay=false) while the modal is up; flipping back resumes.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || counting) return;
    if (!shouldPlay) {
      if (!video.paused) video.pause();
      return;
    }
    video.muted = muted;
    video.play().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [counting, shouldPlay]);

  // Tab hidden: pause so it doesn't run in a background tab. Tab back: resume.
  useEffect(() => {
    const onVisibility = () => {
      const video = videoRef.current;
      if (!video || counting) return;
      if (document.hidden) {
        if (!video.paused) video.pause();
      } else if (shouldPlay) {
        video.play().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [counting, shouldPlay]);

  // Escape maps to one action at a time, in priority order:
  //   1. Full-screen -> shrink back to the corner
  //   2. Counting    -> skip the 3-2-1 and ask for the modal
  //   3. Playing     -> close the widget
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (expanded) {
        setExpanded(false);
        return;
      }
      if (counting) {
        setCounting(false);
        onLeaderSkip?.();
        return;
      }
      onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded, counting, onLeaderSkip, onClose]);

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const next = !muted;
    video.muted = next;
    setMuted(next);
    if (!next && shouldPlay) video.play().catch(() => {});
  };

  const toggleExpanded = () => setExpanded((e) => !e);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video || counting) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  };

  const bottomClass = aboveDemoBar ? "bottom-24 md:bottom-4" : "bottom-4";
  const containerClass = expanded
    ? "fixed inset-0 z-[60] bg-black"
    : `fixed ${bottomClass} right-4 z-50 h-40 w-72 overflow-hidden rounded-lg border border-border bg-black shadow-xl print:hidden`;

  return (
    <div
      className={containerClass}
      data-cookie-corner-video
      data-counting={counting ? "" : undefined}
      data-expanded={expanded ? "" : undefined}
    >
      <video
        ref={videoRef}
        src={VIDEO_SRC}
        poster={POSTER_SRC}
        muted
        playsInline
        loop
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onClick={togglePlay}
        className="h-full w-full cursor-pointer object-cover"
        aria-label="Pan Dude, Chief Context Officer"
      />
      {counting && (
        <HeroLeader loading={false} onDone={endLeader} compact />
      )}

      {/* Controls, centered along the bottom of the widget */}
      <div className="pointer-events-none absolute inset-x-0 bottom-2 flex items-center justify-center gap-1">
        <Button
          size="icon"
          variant="ghost"
          onClick={toggleMute}
          aria-label={muted ? "Enable music" : "Mute"}
          aria-pressed={!muted}
          className="pointer-events-auto h-8 w-8 rounded-full bg-background/40 text-foreground backdrop-blur-md hover:bg-background/60"
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={toggleExpanded}
          aria-label={expanded ? "Exit full screen" : "Full screen"}
          aria-pressed={expanded}
          className="pointer-events-auto h-8 w-8 rounded-full bg-background/40 text-foreground backdrop-blur-md hover:bg-background/60"
        >
          {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          aria-label="Close and choose cookies"
          className="pointer-events-auto h-8 w-8 rounded-full bg-background/40 text-foreground backdrop-blur-md hover:bg-background/60"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Pause indicator while the video is paused mid-play */}
      {!counting && !playing && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="rounded-full bg-background/40 px-3 py-1 text-xs text-foreground backdrop-blur-md">
            Paused
          </span>
        </div>
      )}
    </div>
  );
}
