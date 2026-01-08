import { DEFAULT_CONFIG } from "../types/config";

import { parseInline } from "./inline";

import type { Token } from "./tokenizer";
import type {
  ColumnsNode,
  ContentNode,
  DividerNode,
  DocumentNode,
  EntryNode,
  HeaderNode,
  ListItemNode,
  ListNode,
  PageNode,
  ParagraphNode,
  SectionNode,
  TagsNode,
} from "../types/ast";
import type { DocumentConfig } from "../types/config";

/**
 * Parse config block tokens into DocumentConfig
 */
export function parseConfig(tokens: Token[]): DocumentConfig {
  const config: DocumentConfig = { ...DEFAULT_CONFIG };

  for (const token of tokens) {
    if (token.type === "metadata" && token.meta) {
      const key = token.meta.key as string;
      const value = token.value;

      switch (key) {
        case "format":
          if (value === "A4" || value === "Letter") {
            config.format = value;
          }
          break;
        case "margins": {
          const parts = value.split(/\s+/).map(Number);
          if (parts.length === 4 && parts.every((n) => !isNaN(n))) {
            config.margins = parts as [number, number, number, number];
          }
          break;
        }
        case "theme":
          config.theme = value;
          break;
      }
    }
  }

  return config;
}

/**
 * Create a header node from heading and metadata tokens
 */
export function createHeaderNode(
  nameToken: Token,
  metadataTokens: Token[],
): HeaderNode {
  const header: HeaderNode = {
    type: "header",
    name: nameToken.value,
    position: {
      start: { line: nameToken.line, column: nameToken.column },
      end: { line: nameToken.line, column: nameToken.column },
    },
  };

  for (const token of metadataTokens) {
    if (token.type === "metadata" && token.meta) {
      const key = token.meta.key as string;
      if (key === "subtitle") {
        header.subtitle = token.value;
      } else if (key === "contact") {
        header.contact = token.meta.parsedValue as string[];
      }
    }
  }

  return header;
}

/**
 * Create a section node
 */
export function createSectionNode(
  titleToken: Token,
  children: ContentNode[],
): SectionNode {
  return {
    type: "section",
    title: titleToken.value,
    children,
    position: {
      start: { line: titleToken.line, column: titleToken.column },
      end: { line: titleToken.line, column: titleToken.column },
    },
  };
}

/**
 * Create an entry node from entry tokens
 */
export function createEntryNode(
  startToken: Token,
  contentTokens: Token[],
): EntryNode {
  const meta = startToken.meta as {
    company: string;
    companyUrl?: string;
    role: string;
    dates: string;
    location?: string;
  };

  const children: ContentNode[] = [];
  const pendingListItems: Token[] = [];

  // Helper to flush list items
  const flushList = () => {
    if (pendingListItems.length > 0) {
      children.push(createListNode(pendingListItems.splice(0)));
    }
  };

  // Parse content tokens into paragraph/list nodes
  for (const token of contentTokens) {
    if (token.type === "list_item") {
      pendingListItems.push(token);
    } else if (token.type === "text") {
      flushList();
      const trimmed = token.value.trim();
      if (trimmed) {
        children.push(createParagraphNode(trimmed, token));
      }
    }
  }

  // Flush remaining list items
  flushList();

  return {
    type: "entry",
    company: meta.company,
    companyUrl: meta.companyUrl,
    role: meta.role,
    dates: meta.dates,
    location: meta.location,
    children,
    position: {
      start: { line: startToken.line, column: startToken.column },
      end: { line: startToken.line, column: startToken.column },
    },
  };
}

/**
 * Create a columns node
 */
export function createColumnsNode(
  startToken: Token,
  leftChildren: ContentNode[],
  rightChildren: ContentNode[],
): ColumnsNode {
  const meta = startToken.meta as { left: number; right: number };

  return {
    type: "columns",
    ratio: [meta.left, meta.right],
    children: [
      {
        type: "column",
        children: leftChildren,
      },
      {
        type: "column",
        children: rightChildren,
      },
    ],
    position: {
      start: { line: startToken.line, column: startToken.column },
      end: { line: startToken.line, column: startToken.column },
    },
  };
}

/**
 * Create a tags node from tag tokens
 */
export function createTagsNode(tagTokens: Token[]): TagsNode {
  return {
    type: "tags",
    items: tagTokens.map((t) => t.value),
    position: tagTokens[0]
      ? {
          start: { line: tagTokens[0].line, column: tagTokens[0].column },
          end: { line: tagTokens[0].line, column: tagTokens[0].column },
        }
      : undefined,
  };
}

/**
 * Create a divider node
 */
export function createDividerNode(token: Token): DividerNode {
  return {
    type: "divider",
    position: {
      start: { line: token.line, column: token.column },
      end: { line: token.line, column: token.column },
    },
  };
}

/**
 * Create a paragraph node with inline formatting support
 */
export function createParagraphNode(text: string, token: Token): ParagraphNode {
  return {
    type: "paragraph",
    children: parseInline(text),
    position: {
      start: { line: token.line, column: token.column },
      end: { line: token.line, column: token.column },
    },
  };
}

/**
 * Create a page node
 */
export function createPageNode(
  startToken: Token,
  children: ContentNode[],
): PageNode {
  return {
    type: "page",
    children,
    position: {
      start: { line: startToken.line, column: startToken.column },
      end: { line: startToken.line, column: startToken.column },
    },
  };
}

/**
 * Create a list item node with inline formatting support
 */
export function createListItemNode(text: string, token: Token): ListItemNode {
  return {
    type: "listItem",
    children: [
      {
        type: "paragraph",
        children: parseInline(text),
      } as ParagraphNode,
    ],
    position: {
      start: { line: token.line, column: token.column },
      end: { line: token.line, column: token.column },
    },
  };
}

/**
 * Create a list node from list item tokens
 */
export function createListNode(itemTokens: Token[]): ListNode {
  return {
    type: "list",
    ordered: false,
    children: itemTokens.map((t) => createListItemNode(t.value, t)),
    position: itemTokens[0]
      ? {
          start: { line: itemTokens[0].line, column: itemTokens[0].column },
          end: { line: itemTokens[0].line, column: itemTokens[0].column },
        }
      : undefined,
  };
}

/**
 * Create a document node
 */
export function createDocumentNode(
  config: DocumentConfig,
  pages: PageNode[],
): DocumentNode {
  return {
    type: "document",
    config,
    children: pages,
  };
}
