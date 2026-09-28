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
  return (
    <div className="window-video">
      <video src={src} poster={poster} autoPlay loop muted playsInline preload="metadata" aria-label={title} />
    </div>
  );
}
