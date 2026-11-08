import type { AnchorHTMLAttributes, ReactNode } from "react";
import * as runtime from "react/jsx-runtime";
import { evaluate } from "@mdx-js/mdx";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import type { TOCItem } from "@sbozh/blog/utils";

import { glitchMdxComponents } from "./glitch/mdx-components";
import remarkGlitch from "./remark-glitch";
import remarkHeadingIds from "./remark-heading-ids";
import remarkSubmissionSafe from "./remark-submission-safe";
import { renderTitle } from "./title-heading";

/**
 * Renders a /blog/submit text into the parts of a post page (see PostArticle): title,
 * excerpt, TL;DR, table of contents, body. Runs in the writer's browser only; the server
 * never evaluates a submission. remark-submission-safe runs first in every compile, so
 * the writer's own code never runs.
 *
 * Code blocks aren't highlighted: the post page's highlighter is too heavy to ship here.
 */

export interface SubmissionMeta {
  readonly title?: string;
  readonly author?: string;
  readonly excerpt?: string;
  readonly tldr?: string;
  readonly tags: readonly string[];
}

export interface RenderedSubmission {
  readonly meta: SubmissionMeta;
  readonly title?: ReactNode;
  readonly tldr?: ReactNode;
  readonly toc: TOCItem[];
  readonly readingTime: number;
}

export type PreviewResult =
  | ({ readonly ok: true; readonly content: ReactNode } & RenderedSubmission)
  | { readonly ok: false; readonly meta: SubmissionMeta; readonly error: string };

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;
/** A first paragraph starting with "TL;DR:" (bold or not) becomes the TL;DR block. */
const LEADING_TLDR = /^\s*(?:\*\*TL;DR:?\*\*:?|TL;DR:)[ \t]*((?:[^\n]+\n?)+?)(?:\n\s*\n|\s*$)/i;
const WORDS_PER_MINUTE = 200;

const unquote = (value: string) => value.trim().replace(/^(["'])(.*)\1$/, "$2");

function parseTags(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map(unquote)
    .filter(Boolean);
}

/** Obsidian-style frontmatter at the top: the post's fields, not its text. */
export function splitFrontmatter(source: string): { meta: SubmissionMeta; body: string } {
  const match = FRONTMATTER.exec(source);
  if (!match) return { body: source, meta: { tags: [] } };

  const fields: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const pair = /^([A-Za-z_]+):\s*(.*)$/.exec(line);
    if (pair) fields[pair[1].toLowerCase()] = unquote(pair[2]);
  }
  return {
    body: source.slice(match[0].length),
    meta: {
      author: fields.author || undefined,
      excerpt: fields.excerpt || undefined,
      tags: parseTags(fields.tags),
      title: fields.title || undefined,
      tldr: fields.tldr || undefined,
    },
  };
}

/** The TL;DR from the frontmatter, or lifted off the top of the body like posts keep it apart. */
export function splitTldr(body: string, fromMeta?: string): { tldr?: string; body: string } {
  if (fromMeta) return { body, tldr: fromMeta };
  const match = LEADING_TLDR.exec(body);
  if (!match) return { body };
  return { body: body.slice(match[0].length), tldr: match[1].trim() };
}

export function estimateReadingTime(text: string): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

interface ParseError {
  readonly line?: number;
  readonly place?: { readonly line?: number; readonly start?: { readonly line?: number } };
  readonly reason?: string;
  readonly message?: string;
}

/** `offset`: lines before the body, so the number matches the writer's text. */
function describeError(error: unknown, offset: number): string {
  const { line, place, reason, message } = error as ParseError;
  const text = reason || message || "The text could not be read.";
  const at = place?.start?.line ?? place?.line ?? line;
  return at ? `Line ${at + offset}: ${text}` : text;
}

// Same link behaviour as the post page: external links open in a new tab
function Link(props: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const external = /^https?:\/\//.test(props.href ?? "");
  return external ? <a {...props} target="_blank" rel="noopener noreferrer" /> : <a {...props} />;
}

const components = { ...glitchMdxComponents, a: Link };

async function compile(source: string, extra: unknown[] = [], rehype: unknown[] = []) {
  const { default: Content } = await evaluate(source, {
    ...runtime,
    remarkPlugins: [remarkSubmissionSafe, remarkGfm, remarkGlitch, ...extra],
    rehypePlugins: rehype,
  } as Parameters<typeof evaluate>[1]);
  return <Content components={components} />;
}

export async function renderSubmission(source: string, formTitle = ""): Promise<PreviewResult> {
  const { meta, body: afterMeta } = splitFrontmatter(source);
  const { body, tldr } = splitTldr(afterMeta, meta.tldr);
  const offset = source.slice(0, source.length - body.length).split("\n").length - 1;

  let toc: TOCItem[] = [];
  try {
    const content = await compile(
      body,
      [[remarkHeadingIds, { onHeadings: (items: TOCItem[]) => (toc = items) }]],
      [rehypeSlug],
    );
    const titleText = formTitle.trim() || meta.title;
    return {
      content,
      meta,
      ok: true,
      readingTime: estimateReadingTime(body),
      title: titleText ? await renderTitle(titleText) : undefined,
      tldr: tldr ? await compile(tldr).catch(() => tldr) : undefined,
      toc,
    };
  } catch (error) {
    return { error: describeError(error, offset), meta, ok: false };
  }
}
