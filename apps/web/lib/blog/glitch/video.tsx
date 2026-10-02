"use client";

import { useStillTheme } from "@sbozh/themes";

import "./glitch.css";

interface VideoProps {
  src: string;
  poster?: string;
  /** Accessible name. */
  title?: string;
}

/**
 * A silent looping video in a post, sized for landscape and vertical (Shorts) cuts:
 *
 *   <Video src="/api/assets/<id>" poster="/api/assets/<id>" title="Pan Dude" />
 *
 * For two cuts switched by the window, use <WindowVideo> instead.
 */
export function Video({ src, poster, title }: VideoProps) {
  // Roman White: nothing moves until the reader presses play
  const still = useStillTheme();
  return (
    <div className="window-video">
      <video
        key={still ? "still" : "loop"}
        src={src}
        poster={poster}
        autoPlay={!still}
        controls={still}
        loop
        muted
        playsInline
        preload="metadata"
        aria-label={title}
      />
    </div>
  );
}
