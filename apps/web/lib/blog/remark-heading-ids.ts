import GithubSlugger from "github-slugger";
import type { Heading, Nodes, Root } from "mdast";
import type { TOCItem } from "@sbozh/blog/utils";

/**
 * Gives every heading its anchor id from its *rendered* text and reports h2-h4 for the
 * table of contents. Runs after remark-glitch, so a glitch word counts as its base state
 * (`## ==Дарио|CEO==` → "Дарио"), a censor as ✳ and the brand as "D✳CK PITCH". The raw
 * markdown would otherwise leak `==a|b==` into the TOC and break its anchors.
 *
 * Ids use the same slugger as rehype-slug over the same heading order, so headings
 * without glitch syntax keep the ids they had before (rehype-slug skips headings that
 * already have one).
 *
 * Headings inside an <Accordion> (e.g. the older version of a rewritten post) get ids but
 * stay out of the TOC: they're hidden until the reader opens it.
 */

export const TOC_DEPTHS = [2, 3, 4];

export interface RemarkHeadingIdsOptions {
  onHeadings?: (items: TOCItem[]) => void;
}

export default function remarkHeadingIds({ onHeadings }: RemarkHeadingIdsOptions = {}) {
  return (tree: Root) => {
    const slugger = new GithubSlugger();
    const items: TOCItem[] = [];

    visitHeadings(tree, false, (heading, collapsed) => {
      const text = plainText(heading).replace(/\s+/g, " ").trim();
      const id = slugger.slug(text);
      heading.data = { ...heading.data, hProperties: { ...heading.data?.hProperties, id } };
      if (!collapsed && TOC_DEPTHS.includes(heading.depth)) {
        items.push({ id, text, level: heading.depth });
      }
    });

    onHeadings?.(items);
  };
}

function visitHeadings(
  node: Nodes,
  collapsed: boolean,
  fn: (heading: Heading, collapsed: boolean) => void,
) {
  if (node.type === "heading") fn(node, collapsed);
  else if ("children" in node) {
    const inside = collapsed || (node.type === "mdxJsxFlowElement" && node.name === "Accordion");
    node.children.forEach((child) => visitHeadings(child as Nodes, inside, fn));
  }
}

/** A node's text as it reads with the glitch effects at rest (also used for post titles). */
export function plainText(node: Nodes): string {
  if (node.type === "text" || node.type === "inlineCode") return node.value;
  if (node.type === "mdxJsxTextElement") {
    switch (node.name) {
      case "Glitch":
        // Only the base state is what the heading reads as
        return node.children[0] ? plainText(node.children[0] as Nodes) : "";
      case "Censor":
        return "✳";
      case "DickPitch":
        return "D✳CK PITCH";
      case "Sbozhed": {
        const text = node.attributes.find((a) => a.type === "mdxJsxAttribute" && a.name === "text");
        return typeof text?.value === "string" ? text.value : "";
      }
      case "WindowToggle":
        return "";
    }
  }
  if ("children" in node) return node.children.map((child) => plainText(child as Nodes)).join("");
  return "";
}
