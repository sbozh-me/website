"use client";

import { useEffect, useState } from "react";

import { PostArticle } from "@/lib/blog/post-article";
import type { PreviewResult } from "@/lib/blog/submission-preview";

/** Long enough not to recompile on every keystroke if the preview stays open. */
const DEBOUNCE_MS = 250;

/** Submissions are signed by a pen name, not a site persona: one neutral colour for all. */
const GUEST_COLOR = "#a1a1aa";

interface SubmissionPreviewProps {
  readonly content: string;
  readonly title: string;
  readonly penName: string;
}

/**
 * The text exactly as a published post: the post page's own PostArticle, fed by the
 * same plugins. The compiler is loaded on first use, so the submit page stays light
 * for people who never preview.
 */
export function SubmissionPreview({ content, title, penName }: SubmissionPreviewProps) {
  const [result, setResult] = useState<PreviewResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      const { renderSubmission } = await import("@/lib/blog/submission-preview");
      const next = await renderSubmission(content, title);
      if (!cancelled) setResult(next);
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [content, title]);

  if (!result) {
    return <p className="py-12 text-center text-sm text-muted-foreground">Rendering…</p>;
  }

  if (!result.ok) {
    return (
      <div role="alert" className="space-y-2 py-6 text-sm">
        <p className="text-destructive">{result.error}</p>
        <p className="text-muted-foreground">
          The text is read as MDX. A literal <code>{"{"}</code> or <code>{"<"}</code> needs a
          backslash: <code>{"\\{"}</code>, <code>{"\\<"}</code>. You can still send it as is.
        </p>
      </div>
    );
  }

  const name = penName.trim() || result.meta.author || "Anonymous";

  return (
    <section aria-label="Preview">
      <p className="mb-8 text-center text-xs uppercase tracking-widest text-muted-foreground">
        Preview · not published
      </p>
      <PostArticle
        post={{
          date: new Date().toISOString(),
          excerpt: result.meta.excerpt ?? "",
          persona: { color: GUEST_COLOR, id: "guest", name, slug: "guest" },
          readingTime: result.readingTime,
          tags: result.meta.tags.map((tag) => ({ id: tag, name: tag, slug: tag })),
          title: title.trim() || result.meta.title || "Untitled",
        }}
        title={result.title}
        toc={result.toc}
        tldr={result.tldr}
        content={result.content}
        hero={
          <figure
            aria-label="Hero image"
            className="my-8 flex aspect-[16/9] w-full items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-6 text-center text-sm text-muted-foreground"
          >
            <figcaption>
              Hero image goes here.
              <br />
              The Senate picks it when the text is published.
            </figcaption>
          </figure>
        }
      />
    </section>
  );
}
