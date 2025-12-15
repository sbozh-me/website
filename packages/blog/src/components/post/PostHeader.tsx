import type { Post } from "../../types";
import { formatReadingTime, formatShortDate } from "../../utils";
import { PersonaDot } from "../timeline/PersonaDot";

interface PostHeaderProps {
  post: Post;
}

/**
 * Displays post metadata including persona, title, date, reading time, and tags.
 */
export function PostHeader({ post }: PostHeaderProps) {
  return (
    <header className="mb-8">
      <div className="flex flex-col gap-1 text-sm mb-4">
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
