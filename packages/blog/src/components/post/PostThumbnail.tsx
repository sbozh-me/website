import type { PostListItem } from "../../types";
import { thumbnailSrc } from "../../utils";

interface PostThumbnailProps {
  post: PostListItem;
  width: 320 | 640 | 960;
  className?: string;
}

/**
 * Post hero image scaled down for previews.
 * Posts without an image get a persona-tinted SparkMark placeholder.
 */
export function PostThumbnail({ post, width, className = "" }: PostThumbnailProps) {
  if (post.image) {
    return (
      <img
        src={thumbnailSrc(post.image.src, width)}
        alt={post.image.alt}
        loading="lazy"
        decoding="async"
        className={`object-cover bg-muted ${className}`}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`flex items-center justify-center bg-muted ${className}`}
      style={{
        backgroundImage: `radial-gradient(circle at 30% 20%, ${post.persona.color}33, transparent 70%)`,
      }}
    >
      <span
        className="text-4xl font-bold leading-none bg-clip-text text-transparent"
        style={{ backgroundImage: "linear-gradient(135deg, #8b5cf6, #f59e0b)" }}
      >
        *
      </span>
    </div>
  );
}
