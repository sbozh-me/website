import { Badge } from "@sbozh/react-ui/components/ui/badge";

import { PostThumbnail } from "../post/PostThumbnail";
import { PersonaDot } from "../timeline/PersonaDot";
import { formatShortDate } from "../../utils/date-format";
import { formatReadingTime } from "../../utils/reading-time";

import type { PostListItem } from "../../types/post";
import type { SeriesPart } from "../../utils/series";

const VISIBLE_TAGS = 3;

export interface PostTileProps {
  post: PostListItem;
  /** Shows a link to the series this post is part of */
  seriesPart?: SeriesPart;
}

export function PostTile({ post, seriesPart }: PostTileProps) {
  const hiddenTags = post.tags.length - VISIBLE_TAGS;

  // The series link sits beside the tile's link, not inside it: links can't nest
  return (
    <article className="relative h-full">
      <a
        href={`/blog/${post.slug}`}
        className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-muted transition-colors duration-200 hover:border-primary"
      >
        <PostThumbnail post={post} width={640} className="aspect-video w-full" />
        <div className="flex flex-1 flex-col p-4">
          <PersonaDot color={post.persona.color} name={post.persona.name} showName />
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formatShortDate(post.date)}</span>
            {post.readingTime > 0 && (
              <>
                <span>•</span>
                <span>{formatReadingTime(post.readingTime)}</span>
              </>
            )}
          </div>
          {/* Important: the global h2 size in globals.css is unlayered and beats utilities */}
          <h2 className="mt-3 text-lg! font-semibold leading-snug text-foreground">{post.title}</h2>
          <p className="mt-2 mb-3 text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
          {post.tags.length > 0 && (
            <div className="mt-auto flex flex-wrap gap-1">
              {post.tags.slice(0, VISIBLE_TAGS).map((tag) => (
                <Badge key={tag.id} variant="outline" className="text-muted-foreground">
                  {tag.name}
                </Badge>
              ))}
              {hiddenTags > 0 && (
                <Badge variant="outline" className="text-muted-foreground">
                  +{hiddenTags}
                </Badge>
              )}
            </div>
          )}
        </div>
      </a>
      {seriesPart && (
        <a
          href={`/blog/series/${seriesPart.series.slug}`}
          className="absolute left-3 top-3 max-w-[80%] truncate rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground transition-colors duration-200 hover:border-primary hover:text-foreground"
        >
          {seriesPart.series.title} · Post {seriesPart.part}
        </a>
      )}
    </article>
  );
}
