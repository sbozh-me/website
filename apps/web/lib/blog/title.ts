import type { ComponentType } from "react";
import { evaluate } from "@mdx-js/mdx";
import type { Root } from "mdast";
import * as runtime from "react/jsx-runtime";
import remarkGfm from "remark-gfm";

import remarkGlitch from "./remark-glitch";
import { plainText } from "./remark-heading-ids";

/**
 * Post titles from Directus may use the glitch syntax (`==Yeter|ENOUGH!==`, `(;)`) and
 * inline markdown. The post page's <h1> renders it (title-heading.tsx); everywhere else
 * (the browser tab, OG image, timeline cards, prev/next links) gets the plain text, read
 * the way the TOC reads headings: a glitch word as its base state, a censor as ✳.
 */

// Only titles with glitch syntax or markdown need the MDX pass
const MARKUP = /==|\(;\)|[*_`[\]~\\]/;

export interface CompiledTitle {
  text: string;
  Title: ComponentType<{ components?: Record<string, ComponentType<any>> }>;
}

export function hasTitleMarkup(title: string): boolean {
  return MARKUP.test(title);
}

/**
 * A title is one line of inline text: escape whatever would start a block, so
 * "1. Intro", "# tag" or "> quote" stay a paragraph.
 */
export function titleMarkdown(title: string): string {
  return title
    .trim()
    .replace(/^(\d+)([.)])/, "$1\\$2")
    .replace(/^([#*+-])(?=\s|$)/, "\\$1")
    .replace(/^>/, "\\>");
}

export async function compileTitle(title: string): Promise<CompiledTitle> {
  let text = title;
  const { default: Title } = await evaluate(titleMarkdown(title), {
    ...runtime,
    // Plain markdown: `<` and `{` in a title are text, not JSX or expressions
    format: "md",
    remarkPlugins: [
      remarkGfm,
      remarkGlitch,
      () => (tree: Root) => {
        text = plainText(tree).replace(/\s+/g, " ").trim();
      },
    ],
  } as any);
  return { text, Title };
}

/** The title's plain text; titles without markup are returned as they are. */
export async function plainTitle(title: string): Promise<string> {
  if (!hasTitleMarkup(title)) return title;
  try {
    return (await compileTitle(title)).text;
  } catch {
    return title;
  }
}
