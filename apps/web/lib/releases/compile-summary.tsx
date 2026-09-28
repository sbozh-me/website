import type { ReactNode } from "react";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import remarkGfm from "remark-gfm";
import remarkGlitch from "@/lib/blog/remark-glitch";
import { glitchMdxComponents } from "@/lib/blog/glitch/mdx-components";

/**
 * Compile a release note summary (markdown from Directus) to a React element.
 * Release notes speak the blog's glitch syntax too: ==a|b==, (;), ==WINDOW==.
 * The window switch is page-wide, so one ==WINDOW== toggles every note on the page.
 * Runs on the server and, for "Load more", on the client.
 */
export async function compileSummary(markdown: string): Promise<ReactNode> {
  const { default: Content } = await evaluate(markdown, {
    ...runtime,
    remarkPlugins: [remarkGfm, remarkGlitch],
  } as Parameters<typeof evaluate>[1]);
  return <Content components={glitchMdxComponents} />;
}
