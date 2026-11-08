import type { ReactNode } from "react";
import Image from "next/image";
import { PostHeader, PostLayout, TableOfContents } from "@sbozh/blog/components";
import type { Post } from "@sbozh/blog";
import type { AdjacentPosts, TOCItem } from "@sbozh/blog/utils";

/**
 * One blog post as the reader sees it: header, excerpt, TL;DR, hero image, table of
 * contents, body and attribution. Shared by the post page (server) and the /blog/submit
 * preview (client), so a preview looks exactly like the published post.
 */
export interface PostArticleProps {
  readonly post: Pick<Post, "title" | "excerpt" | "date" | "readingTime" | "persona" | "tags" | "image">;
  readonly adjacent?: AdjacentPosts;
  /** Rendered title with inline syntax; defaults to post.title */
  readonly title?: ReactNode;
  readonly toc?: TOCItem[];
  readonly tldr?: ReactNode;
  readonly content: ReactNode;
  readonly attribution?: ReactNode;
  readonly imageAttribution?: ReactNode;
  /** Below the attribution: prev/next navigation on the post page */
  readonly footer?: ReactNode;
}

export function PostArticle({
  post,
  adjacent,
  title,
  toc = [],
  tldr,
  content,
  attribution,
  imageAttribution,
  footer,
}: PostArticleProps) {
  return (
    <PostLayout toc={toc}>
      <div>
        <PostHeader post={post as Post} adjacent={adjacent} title={title} />
        {post.excerpt && (
          <p className="post-excerpt mb-6 text-lg leading-relaxed text-foreground/85">
            {post.excerpt}
          </p>
        )}
        {tldr && (
          <div className="text-muted-foreground mb-6 [&_p]:inline">
            <span className="font-medium">TL;DR: </span>
            {tldr}
          </div>
        )}
        {post.image && (
          <figure className="my-8">
            <Image
              src={post.image.src}
              alt={post.image.alt}
              width={post.image.width || 1920}
              height={post.image.height || 1080}
              className="w-full h-auto rounded-lg"
              priority
            />
            {imageAttribution && (
              <figcaption className="mt-2 text-right text-[11px] leading-snug text-muted-foreground/70 [&_a]:underline [&_a]:decoration-muted-foreground/30 [&_a]:underline-offset-2 [&_a:hover]:text-muted-foreground [&_p]:m-0">
                {imageAttribution}
              </figcaption>
            )}
          </figure>
        )}
        {toc.length > 0 && (
          <div className="lg:hidden mb-8">
            <TableOfContents items={toc} />
          </div>
        )}
        <div className="prose">{content}</div>
        {attribution && (
          <div className="mt-12 pt-8 border-t border-border">
            <h4 className="text-xs font-medium text-muted-foreground mb-3">Attribution</h4>
            <div className="attribution-content text-xs text-muted-foreground [&_a]:text-muted-foreground [&_a]:underline [&_p]:m-0">
              {attribution}
            </div>
          </div>
        )}
        {footer}
      </div>
    </PostLayout>
  );
}
