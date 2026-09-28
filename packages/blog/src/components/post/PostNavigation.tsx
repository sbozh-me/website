import type { PostListItem } from "../../types";
import type { AdjacentPosts } from "../../utils";
import { formatShortDate } from "../../utils";
import { ArrowIcon } from "./ArrowIcon";
import { PostThumbnail } from "./PostThumbnail";

/**
 * Previous/next post cards shown after the post content.
 * Mobile: stacked compact rows (thumbnail beside text).
 * Desktop: two columns with full-width thumbnails; "next" stays in the right column.
 */
export function PostNavigation({ previous, next }: AdjacentPosts) {
  if (!previous && !next) {
    return null;
  }

  return (
    <nav
      aria-label="More posts"
      className="mt-16 grid grid-cols-1 gap-4 border-t border-border pt-8 sm:grid-cols-2"
    >
      {previous && <NavCard post={previous} direction="previous" />}
      {next && <NavCard post={next} direction="next" />}
    </nav>
  );
}

function NavCard({ post, direction }: { post: PostListItem; direction: "previous" | "next" }) {
  const isNext = direction === "next";

  return (
    <a
      href={`/blog/${post.slug}`}
      rel={isNext ? "next" : "prev"}
      className={`group flex overflow-hidden rounded-lg border border-border bg-muted transition-colors duration-200 hover:border-primary sm:flex-col ${
        isNext ? "flex-row-reverse sm:col-start-2" : "flex-row"
      }`}
    >
      <PostThumbnail
        post={post}
        width={960}
        className="w-28 shrink-0 self-stretch sm:aspect-video sm:w-full sm:self-auto"
      />
      <div className={`min-w-0 flex-1 p-4 ${isNext ? "text-right" : ""}`}>
        <div
          className={`mb-1 flex items-center gap-1.5 text-xs text-muted-foreground ${
            isNext ? "justify-end" : ""
          }`}
        >
          {!isNext && (
            <ArrowIcon
              direction="previous"
              className="size-3.5 transition-transform duration-200 group-hover:-translate-x-0.5"
            />
          )}
          <span>{isNext ? "Next post" : "Previous post"}</span>
          {isNext && (
            <ArrowIcon
              direction="next"
              className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
            />
          )}
        </div>
        <div className="mb-1 font-semibold leading-snug text-foreground line-clamp-2">
          {post.title}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 max-sm:hidden">
          {post.excerpt}
        </p>
        <time dateTime={post.date} className="text-xs text-muted-foreground sm:hidden">
          {formatShortDate(post.date)}
        </time>
      </div>
    </a>
  );
}
