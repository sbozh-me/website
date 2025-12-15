import { PersonaDot } from "./PersonaDot";
import { formatShortDate } from "../../utils/date-format";
import { formatReadingTime } from "../../utils/reading-time";

import type { PostListItem } from "../../types/post";

export interface PostCardProps {
  post: PostListItem;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <a
      href={`/blog/${post.slug}`}
      className="block bg-muted border border-border rounded-lg p-5 mb-4 transition-colors duration-200 hover:border-primary"
    >
      <div className="flex flex-col gap-1 mb-3 text-sm">
        <PersonaDot
          color={post.persona.color}
          name={post.persona.name}
          showName
        />
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>{formatShortDate(post.date)}</span>
          <span>•</span>
          <span>{formatReadingTime(post.readingTime)}</span>
        </div>
      </div>

      <h4 className="text-lg font-semibold text-foreground mb-2">
        {post.title}
      </h4>

      <p className="text-muted-foreground text-sm line-clamp-2">
        {post.excerpt}
      </p>
    </a>
  );
}
