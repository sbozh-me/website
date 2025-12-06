import type {
  EmphasisNode,
  InlineNode,
  LinkNode,
  SparkNode,
  StrongNode,
  TextNode,
} from "../types/ast";

/**
 * Parse inline markdown formatting (bold, italic, links, spark)
 *
 * Supports:
 * - **bold** or __bold__
 * - *italic* or _italic_
 * - [text](url)
 * - {*} (spark - branded asterisk)
 */
export function parseInline(text: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    // Try to match spark {*}
    const sparkMatch = remaining.match(/^\{\*\}/);
    if (sparkMatch) {
      const sparkNode: SparkNode = {
        type: "spark",
      };
      nodes.push(sparkNode);
      remaining = remaining.slice(sparkMatch[0].length);
      continue;
    }

    // Try to match bold (**text** or __text__)
    const boldMatch = remaining.match(/^(\*\*|__)(.+?)\1/);
    if (boldMatch) {
      const strongNode: StrongNode = {
        type: "strong",
        children: parseInline(boldMatch[2]), // Recursively parse inner content
      };
      nodes.push(strongNode);
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Try to match italic (*text* or _text_) - but not ** or __
    const italicMatch = remaining.match(/^(\*|_)(?!\1)(.+?)\1(?!\1)/);
    if (italicMatch) {
      const emphasisNode: EmphasisNode = {
        type: "emphasis",
        children: parseInline(italicMatch[2]), // Recursively parse inner content
      };
      nodes.push(emphasisNode);
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Try to match link [text](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      const linkNode: LinkNode = {
        type: "link",
        url: linkMatch[2],
        children: parseInline(linkMatch[1]), // Recursively parse link text
      };
      nodes.push(linkNode);
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // Find the next special character
    const nextSpecial = remaining.search(/\{|\*|_|\[/);

    if (nextSpecial === -1) {
      // No more special characters, rest is plain text
      if (remaining.length > 0) {
        const textNode: TextNode = {
          type: "text",
          value: remaining,
        };
        nodes.push(textNode);
      }
      break;
    } else if (nextSpecial === 0) {
      // Special character at start but didn't match a pattern
      // Treat it as plain text and move forward one character
      const textNode: TextNode = {
        type: "text",
        value: remaining[0],
      };
      nodes.push(textNode);
      remaining = remaining.slice(1);
    } else {
      // Plain text before the next special character
      const textNode: TextNode = {
        type: "text",
        value: remaining.slice(0, nextSpecial),
      };
      nodes.push(textNode);
      remaining = remaining.slice(nextSpecial);
    }
  }

  // Merge adjacent text nodes
  return mergeTextNodes(nodes);
}

/**
 * Merge adjacent text nodes into single nodes
 */
function mergeTextNodes(nodes: InlineNode[]): InlineNode[] {
  const merged: InlineNode[] = [];

  for (const node of nodes) {
    const last = merged[merged.length - 1];
    if (node.type === "text" && last?.type === "text") {
      // Merge with previous text node
      last.value += node.value;
    } else {
      merged.push(node);
    }
  }

  return merged;
}
