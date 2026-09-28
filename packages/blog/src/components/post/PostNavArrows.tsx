"use client";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@sbozh/react-ui/components/ui/hover-card";
import type { PostListItem } from "../../types";
import type { AdjacentPosts } from "../../utils";
import { formatShortDate } from "../../utils";
import { ArrowIcon } from "./ArrowIcon";
import { PostThumbnail } from "./PostThumbnail";

type Direction = "previous" | "next";

const LABELS: Record<Direction, string> = {
  previous: "Previous post",
  next: "Next post",
};

/**
 * Compact back/forward arrows for the post header.
 * Hovering an arrow previews the target post; on touch devices
 * the hover card never opens and a tap simply navigates.
 */
export function PostNavArrows({ previous, next }: AdjacentPosts) {
  if (!previous && !next) {
    return null;
  }

  return (
    <nav aria-label="Post navigation" className="flex items-center gap-2">
      {previous && <NavArrow post={previous} direction="previous" />}
      {next && <NavArrow post={next} direction="next" />}
    </nav>
  );
}

function NavArrow({ post, direction }: { post: PostListItem; direction: Direction }) {
  return (
    <HoverCard openDelay={150} closeDelay={100}>
      <HoverCardTrigger asChild>
        <a
          href={`/blog/${post.slug}`}
          rel={direction === "previous" ? "prev" : "next"}
          aria-label={`${LABELS[direction]}: ${post.title}`}
          className="inline-flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors duration-200 hover:border-primary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowIcon direction={direction} />
        </a>
      </HoverCardTrigger>
      <HoverCardContent side="bottom" align="end" className="w-72 overflow-hidden border-border p-0">
        <a href={`/blog/${post.slug}`} className="block" tabIndex={-1}>
          <PostThumbnail post={post} width={640} className="aspect-video w-full" />
          <div className="p-4">
            <div className="mb-1 text-xs text-muted-foreground">
              {LABELS[direction]} · {formatShortDate(post.date)}
            </div>
            <div className="mb-1 font-semibold leading-snug text-foreground">
              {post.title}
            </div>
            <p className="line-clamp-3 text-sm text-muted-foreground">
              {post.excerpt}
            </p>
          </div>
        </a>
      </HoverCardContent>
    </HoverCard>
  );
}
