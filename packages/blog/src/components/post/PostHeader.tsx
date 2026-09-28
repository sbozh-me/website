import type { Post } from "../../types";
import type { AdjacentPosts } from "../../utils";
import { formatReadingTime, formatShortDate } from "../../utils";
import { PersonaDot } from "../timeline/PersonaDot";
import { PostNavArrows } from "./PostNavArrows";

interface PostHeaderProps {
  post: Post;
  adjacent?: AdjacentPosts;
}

/**
 * Displays post metadata including persona, title, date, reading time, and tags.
 * With adjacent posts, previous/next arrows sit beside the metadata.
 */
export function PostHeader({ post, adjacent }: PostHeaderProps) {
  return (
    <header className="mb-8">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex flex-col gap-1 text-sm">
          <PersonaDot
            color={post.persona.color}
            name={post.persona.name}
            showName
          />
          <div className="flex items-center gap-2 text-muted-foreground">
            <time dateTime={post.date}>{formatShortDate(post.date)}</time>
            <span>•</span>
            <span>{formatReadingTime(post.readingTime)}</span>
          </div>
        </div>
        {adjacent && <PostNavArrows {...adjacent} />}
      </div>

      <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">{post.title}</h1>

      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag.id}
              className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground"
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}
    </header>
  );
}
