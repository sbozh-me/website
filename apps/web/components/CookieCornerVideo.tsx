"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2, Volume2, VolumeX, X } from "lucide-react";
import { Button } from "@sbozh/react-ui/components/ui/button";
import { HeroLeader } from "@/components/home/HeroLeader";
import { markLeaderShown, wasLeaderShown } from "@/lib/privacy/decision";

// SD landscape cut: small enough for a corner clip, reused when the widget
// fills the viewport on mobile or on Full screen
const VIDEO_SRC = "/videos/home/pan-dude-desktop.mp4";
const POSTER_SRC = "/videos/home/pan-dude-poster.jpg";
const MOBILE_QUERY = "(max-width: 768px)";

interface CookieCornerVideoProps {
  /**
   * Close button (and, on mobile, a tap on the video). Before a decision the
   * gate hands off to the Emperor modal; after a decision it just hides the
   * widget.
   */
  onClose: () => void;
  /** Fires once when the 3-2-1 leader runs out. The gate opens the modal on this. */
  onLeaderDone?: () => void;
  /** Fires when Escape skips the 3-2-1 leader before it is done. */
  onLeaderSkip?: () => void;
  /**
   * False while the Emperor modal is up: the clip pauses as a cue that the
   * visitor has to decide before it plays again.
   */
  shouldPlay?: boolean;
}

/**
 * Picture-in-picture Pan Dude in the bottom-right corner on desktop, full-screen
 * on mobile: a 3-2-1 film leader plays, then the clip loops. It stays mounted
 * until the visitor hits Close (a dismiss doesn't make it go away).
 *
 * Controls, centered along the bottom: mute, Full screen (desktop only), close.
 * Clicking the picture pauses/resumes it on desktop; on mobile the picture is
 * the close target, so the overlay controls stay for mute and close.
 *
 * Escape maps, in priority: exit Full screen -> skip the leader (+ ask for
 * the modal) -> close the widget.
 */
export function CookieCornerVideo({
  onClose,
  onLeaderDone,
  onLeaderSkip,
  shouldPlay = true,
}: CookieCornerVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // --- Playback state ------------------------------------------------------
  // One 3-2-1 per tab session: if the hero already ran it, skip to the video
  const [counting, setCounting] = useState(() => !wasLeaderShown());
  // Starts muted on every visit, like the home hero
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);

  // --- Layout state --------------------------------------------------------
  const [expanded, setExpanded] = useState(false);
  const mobile = useMatchMedia(MOBILE_QUERY);
  // Mobile is always full-screen; the Full screen toggle only exists on desktop
  const fullscreen = expanded || mobile;

  // --- Leader --------------------------------------------------------------
  const endLeader = useCallback(() => {
    setCounting(false);
    markLeaderShown();
    onLeaderDone?.();
  }, [onLeaderDone]);

  // --- Playback reconciliation --------------------------------------------
  // The video plays iff (leader done) && (shouldPlay) && (tab visible).
  // One effect owns every reason to pause, so there is no ping-pong between
  // competing listeners.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || counting) return;

    const sync = () => {
      const allowed = shouldPlay && !document.hidden;
      if (allowed) {
        video.muted = muted;
        video.play().catch(() => {});
      } else if (!video.paused) {
        video.pause();
      }
    };

    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
    // muted is handled by its own toggle; leaving it out keeps this from
    // re-firing play() on every unmute
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [counting, shouldPlay]);

  // --- Escape handling ----------------------------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (expanded) return setExpanded(false);
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

  // --- Control actions ----------------------------------------------------
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const next = !muted;
    video.muted = next;
    setMuted(next);
    if (!next && shouldPlay) video.play().catch(() => {});
  };

  const toggleExpanded = () => setExpanded((e) => !e);

  // Desktop: click on the picture toggles pause. Mobile: there's no room for
  // a hidden affordance -- a tap is the close target, so the clip exits.
  const onVideoClick = () => {
    if (mobile) return onClose();
    const video = videoRef.current;
    if (!video || counting) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  };

  // z-40 across the board so the Emperor modal (z-50) always sits on top,
  // whether the widget is in the corner or filling the screen on mobile.
  const containerClass = fullscreen
    ? "fixed inset-0 z-40 bg-black print:hidden"
    : "fixed bottom-4 right-4 z-40 h-40 w-72 overflow-hidden rounded-lg border border-border bg-black shadow-xl print:hidden";

  return (
    <div
      className={containerClass}
      data-cookie-corner-video
      data-counting={counting ? "" : undefined}
      data-expanded={expanded ? "" : undefined}
      data-mobile={mobile ? "" : undefined}
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
        onClick={onVideoClick}
        className="h-full w-full cursor-pointer object-cover"
        aria-label="Pan Dude, Chief Context Officer"
      />
      {counting && (
        <HeroLeader loading={false} onDone={endLeader} compact muted={muted} />
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-2 flex items-center justify-center gap-1">
        <OverlayButton
          onClick={toggleMute}
          aria-label={muted ? "Enable music" : "Mute"}
          aria-pressed={!muted}
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </OverlayButton>
        {!mobile && (
          <OverlayButton
            onClick={toggleExpanded}
            aria-label={expanded ? "Exit full screen" : "Full screen"}
            aria-pressed={expanded}
          >
            {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </OverlayButton>
        )}
        <OverlayButton onClick={onClose} aria-label="Close and choose cookies">
          <X className="h-4 w-4" />
        </OverlayButton>
      </div>

      {/* Pause hint only on desktop: mobile has no pause gesture */}
      {!counting && !playing && !mobile && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="rounded-full bg-background/40 px-3 py-1 text-xs text-foreground backdrop-blur-md">
            Paused
          </span>
        </div>
      )}
    </div>
  );
}

function OverlayButton({
  children,
  ...rest
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      size="icon"
      variant="ghost"
      className="pointer-events-auto h-8 w-8 rounded-full bg-background/40 text-foreground backdrop-blur-md hover:bg-background/60"
      {...rest}
    >
      {children}
    </Button>
  );
}

function useMatchMedia(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);
  return matches;
}
