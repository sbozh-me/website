import type { BlockContent, Paragraph, Parent, PhrasingContent, RootContent } from "mdast";
import type { MdxJsxFlowElement } from "mdast-util-mdx-jsx";

/**
 * Shared machinery for the `:::name arg` ... `:::` blocks in blog posts (`:::lang xx`,
 * `:::ai`, `:::nai`, `:::big`). Each remark plugin says which fences are its own and what
 * element replaces them; this module finds the matching closers.
 *
 * - Fences nest. Every `:::<word>` line opens a level and every bare `:::` closes one, so
 *   an `:::ai` block may hold `:::lang` blocks (or the other way around) and each plugin
 *   still finds its own closer, whatever order the plugins run in.
 * - A fence line may sit inside a paragraph (`:::big\nBig words\n:::` with no blank
 *   lines): the paragraph is split so the fence stands on its own.
 * - An opener without a closer is left as plain text, and so is a fence no plugin claims.
 * - An empty block takes no UI space: it is dropped and never reaches `wrap`.
 *
 * PMDX reserves `:::config`, `:::page`, `:::page-end`, `:::entry`, `:::invoice`, `:::party`,
 * `:::qr`, `:::total`, `:::link-qr`, `:::sign`, `:::field` — they are parsed inside a
 * `<PMDX source="…" />` prop string, so they don't collide at this layer, but new blog
 * fences should steer clear of those names so one author can use both at the same time.
 */

export interface Fence {
  /** The word after `:::`, lowercased */
  name: string;
  /** Whatever follows the name on the opener line, trimmed */
  arg: string;
}

const OPENER = /^:::\s*([a-z][\w-]*)(?:\s+(.*?))?\s*$/i;
const CLOSER = /^:::\s*$/;

export function transformFences(
  parent: Parent,
  claims: (fence: Fence) => boolean,
  wrap: (fence: Fence, children: BlockContent[]) => MdxJsxFlowElement,
): void {
  splitFenceParagraphs(parent);

  const children = parent.children as RootContent[];
  const next: RootContent[] = [];
  let i = 0;

  while (i < children.length) {
    const node = children[i];
    const fence = openerOf(node);

    if (!fence || !claims(fence)) {
      // Blocks other plugins already wrapped may still hold fences of ours
      if (node.type === "mdxJsxFlowElement") transformFences(node, claims, wrap);
      next.push(node);
      i += 1;
      continue;
    }

    const close = findCloser(children, i);
    if (close === -1) {
      next.push(node);
      i += 1;
      continue;
    }

    const inner = children.slice(i + 1, close) as BlockContent[];
    if (inner.length > 0) {
      const element = wrap(fence, inner);
      transformFences(element, claims, wrap);
      next.push(element);
    }
    i = close + 1;
  }

  parent.children = next as Parent["children"];
}

/** The closer that matches the opener at `start`, counting nested fences; -1 if none. */
function findCloser(children: RootContent[], start: number): number {
  let depth = 0;
  for (let j = start + 1; j < children.length; j += 1) {
    if (openerOf(children[j])) depth += 1;
    else if (isCloser(children[j])) {
      if (depth === 0) return j;
      depth -= 1;
    }
  }
  return -1;
}

function openerOf(node: RootContent): Fence | null {
  const text = paragraphText(node);
  if (text === null) return null;
  const m = OPENER.exec(text);
  return m ? { name: m[1].toLowerCase(), arg: (m[2] ?? "").trim() } : null;
}

function isCloser(node: RootContent): boolean {
  const text = paragraphText(node);
  return text !== null && CLOSER.test(text);
}

function paragraphText(node: RootContent): string | null {
  if (node.type !== "paragraph") return null;
  if (node.children.length !== 1) return null;
  const child = node.children[0];
  if (child.type !== "text") return null;
  return child.value.trim();
}

function isFenceLine(text: string): boolean {
  return OPENER.test(text) || CLOSER.test(text);
}

/**
 * Splits every paragraph that has a fence on one of its lines, so `:::big\nWords\n:::`
 * reads the same as the fences written with blank lines around them.
 */
function splitFenceParagraphs(parent: Parent) {
  const next: RootContent[] = [];
  for (const node of parent.children as RootContent[]) {
    if (node.type === "paragraph" && hasFenceLine(node)) next.push(...splitParagraph(node));
    else next.push(node);
  }
  parent.children = next as Parent["children"];
}

/** A one-line paragraph that is a fence already stands on its own. */
function hasFenceLine(paragraph: Paragraph): boolean {
  const all = lines(paragraph);
  return all.length > 1 && all.some(isFenceLineOnly);
}

type Line = PhrasingContent[];

/** The paragraph's inline nodes cut at its line breaks (text `\n`, not `<br>`). */
function lines(paragraph: Paragraph): Line[] {
  const out: Line[] = [[]];
  for (const child of paragraph.children) {
    if (child.type !== "text" || !child.value.includes("\n")) {
      out[out.length - 1].push(child);
      continue;
    }
    child.value.split("\n").forEach((segment, k) => {
      if (k > 0) out.push([]);
      if (segment) out[out.length - 1].push({ type: "text", value: segment });
    });
  }
  return out;
}

function lineText(line: Line): string | null {
  if (!line.every((node) => node.type === "text")) return null;
  return line.map((node) => (node as { value: string }).value).join("").trim();
}

function isFenceLineOnly(line: Line): boolean {
  const text = lineText(line);
  return text !== null && isFenceLine(text);
}

function splitParagraph(paragraph: Paragraph): Paragraph[] {
  const out: Paragraph[] = [];
  let run: Line[] = [];

  const flush = () => {
    const children = joinLines(run);
    if (children.length > 0) out.push({ type: "paragraph", children });
    run = [];
  };

  for (const line of lines(paragraph)) {
    if (!isFenceLineOnly(line)) {
      run.push(line);
      continue;
    }
    flush();
    out.push({ type: "paragraph", children: [{ type: "text", value: lineText(line)! }] });
  }
  flush();
  return out;
}

/** Lines back into one run of inline nodes, `\n` between them and adjacent text merged. */
function joinLines(run: Line[]): PhrasingContent[] {
  const out: PhrasingContent[] = [];
  const push = (node: PhrasingContent) => {
    const last = out[out.length - 1];
    if (node.type === "text" && last?.type === "text") last.value += node.value;
    else out.push(node.type === "text" ? { ...node } : node);
  };
  run.forEach((line, k) => {
    if (k > 0) push({ type: "text", value: "\n" });
    line.forEach(push);
  });
  // Leading/trailing line breaks would only be whitespace around the fence
  const first = out[0];
  if (first?.type === "text") first.value = first.value.replace(/^\n+/, "");
  const last = out[out.length - 1];
  if (last?.type === "text") last.value = last.value.replace(/\n+$/, "");
  return out.filter((node) => node.type !== "text" || node.value !== "");
}

export function mdxBlock(
  name: string,
  attributes: Record<string, string>,
  children: BlockContent[],
): MdxJsxFlowElement {
  return {
    type: "mdxJsxFlowElement",
    name,
    attributes: Object.entries(attributes).map(([attr, value]) => ({
      type: "mdxJsxAttribute",
      name: attr,
      value,
    })),
    children,
  };
}
