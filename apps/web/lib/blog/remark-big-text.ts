import type { Root } from "mdast";
import { mdxBlock, transformFences } from "./remark-fences";

/**
 * Big display text in a post body:
 *
 *   :::big
 *   ==D(;)ck pitch==: I'm Spartacus
 *   :::
 *
 * becomes `<BigText>…</BigText>`: as large as an h1 but not a heading, so the page keeps
 * one h1 (the post title) and the line stays out of the table of contents. Markdown and
 * glitch syntax inside work as usual.
 */
export default function remarkBigText() {
  return (tree: Root) => {
    transformFences(
      tree,
      ({ name, arg }) => name === "big" && arg === "",
      (_fence, children) => mdxBlock("BigText", {}, children),
    );
  };
}
