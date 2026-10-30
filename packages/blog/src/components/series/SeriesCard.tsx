import { PostThumbnail } from "../post/PostThumbnail";

import type { SeriesWithPosts } from "../../utils/series";

export type SeriesCardProps = SeriesWithPosts;

export function SeriesCard({ series, posts }: SeriesCardProps) {
  // A series without a Hero image gets the placeholder, tinted by its newest post's persona
  const thumbnail = { ...posts.at(-1)!, image: series.image };

  return (
    <a
      href={`/blog/series/${series.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-muted transition-colors duration-200 hover:border-primary"
    >
      <PostThumbnail post={thumbnail} width={640} className="aspect-video w-full" />
      <div className="p-4">
        <h2 className="mb-1 font-semibold leading-snug text-foreground">{series.title}</h2>
        {series.description && (
          <p className="mb-2 text-sm text-muted-foreground line-clamp-2">{series.description}</p>
        )}
        <div className="text-xs text-muted-foreground">
          {posts.length} {posts.length === 1 ? "post" : "posts"}
        </div>
      </div>
    </a>
  );
}
