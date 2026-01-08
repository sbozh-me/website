import type { ReleaseMedia } from "../types/release";

interface ReleaseMediaCardProps {
  media: ReleaseMedia;
}

export function ReleaseMediaCard({ media }: ReleaseMediaCardProps) {
  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-border bg-muted">
      {media.type === "video" ? (
        <video
          src={media.url}
          controls
          className="aspect-video w-full object-cover"
          aria-label={media.alt}
        />
      ) : (
        <img
          src={media.url}
          alt={media.alt ?? "Release media"}
          className="aspect-video w-full object-cover"
        />
      )}
    </div>
  );
}
