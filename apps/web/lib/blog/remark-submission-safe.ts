import type { Nodes, Parent, Root } from "mdast";
import type { MdxJsxAttribute } from "mdast-util-mdx-jsx";

import { GLITCH_COLORS } from "./glitch/glitch";

/**
 * Remark plugin that makes a stranger's MDX safe to evaluate (the /blog/submit preview).
 * Runs FIRST, before remark-glitch, so only the glitch plugin's own components are added.
 *
 * MDX is code: `{…}` expressions and `import`/`export` run as JavaScript. This keeps the
 * text and drops the code:
 *
 *   {expression}, import/export   -> the same characters as plain text
 *   <Voice color="teal">…</Voice> -> kept, only with a known colour string
 *   any other <Tag>…</Tag>        -> unwrapped: its children stay, the tag goes
 *   links/images                  -> http(s), mailto, relative and #anchors only
 *
 * What's left compiles to static JSX with string literals, nothing the writer controls runs.
 */

const SAFE_URL = /^(https?:|mailto:|\/|#|\.{0,2}\/)/i;
/** Has a scheme (`javascript:`, `data:`…) — anything without one is a relative path. */
const HAS_SCHEME = /^[a-z][a-z\d+.-]*:/i;

export function isSafeUrl(url: string): boolean {
  const trimmed = url.trim();
  return SAFE_URL.test(trimmed) || !HAS_SCHEME.test(trimmed);
}

type AnyNode = Nodes & { children?: Nodes[] };

function voiceColor(attributes: readonly unknown[]): string | null {
  for (const attribute of attributes as MdxJsxAttribute[]) {
    if (
      attribute.type === "mdxJsxAttribute" &&
      attribute.name === "color" &&
      typeof attribute.value === "string" &&
      Object.hasOwn(GLITCH_COLORS, attribute.value)
    ) {
      return attribute.value;
    }
  }
  return null;
}

/** Returns what should stand in the node's place in its parent. */
function clean(node: AnyNode): Nodes[] {
  switch (node.type) {
    case "mdxjsEsm":
    case "mdxFlowExpression":
      return [{ type: "paragraph", children: [{ type: "text", value: sourceOf(node) }] }];
    case "mdxTextExpression":
      return [{ type: "text", value: sourceOf(node) }];
    case "mdxJsxFlowElement":
    case "mdxJsxTextElement": {
      const children = cleanChildren(node.children ?? []);
      const color = node.name === "Voice" ? voiceColor(node.attributes) : null;
      if (color) {
        node.attributes = [{ type: "mdxJsxAttribute", name: "color", value: color }];
        node.children = children as typeof node.children;
        return [node];
      }
      return children;
    }
    case "link":
    case "image":
    case "definition":
      if (!isSafeUrl(node.url)) node.url = "#";
      break;
  }
  if (node.children) node.children = cleanChildren(node.children) as typeof node.children;
  return [node];
}

function cleanChildren(children: Nodes[]): Nodes[] {
  return children.flatMap((child) => clean(child as AnyNode));
}

/** Expressions and ESM keep what the writer typed, braces included. */
function sourceOf(node: { type: string; value?: string }): string {
  const value = node.value ?? "";
  return node.type === "mdxjsEsm" ? value : `{${value}}`;
}

export default function remarkSubmissionSafe() {
  return (tree: Root) => {
    (tree as Parent).children = cleanChildren(tree.children as Nodes[]) as Root["children"];
  };
}
