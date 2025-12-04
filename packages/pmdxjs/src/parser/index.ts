import {
  createColumnsNode,
  createDividerNode,
  createDocumentNode,
  createEntryNode,
  createHeaderNode,
  createPageNode,
  createParagraphNode,
  createSectionNode,
  createTagsNode,
  parseConfig,
} from "./directives";
import { tokenize } from "./tokenizer";
import { DEFAULT_CONFIG } from "../types/config";

import type { Token } from "./tokenizer";
import type { ContentNode, DocumentNode, PageNode } from "../types/ast";
import type { DocumentConfig } from "../types/config";

export type { Token, TokenType } from "./tokenizer";
export { remarkPmdxjs } from "./plugins/remark-pmdxjs";
export { tokenize } from "./tokenizer";

/**
 * Parser state for tracking context during parsing
 */
interface ParserState {
  config: DocumentConfig;
  pages: PageNode[];
  currentPage: ContentNode[];
  currentSection: ContentNode[];
  currentSectionTitle: Token | null;
  columnsContext: {
    active: boolean;
    startToken: Token | null;
    leftColumn: ContentNode[];
    rightColumn: ContentNode[];
    inRightColumn: boolean;
  };
  pendingTags: Token[];
  entryContext: {
    active: boolean;
    startToken: Token | null;
    content: Token[];
  };
}

/**
 * Create initial parser state
 */
function createInitialState(): ParserState {
  return {
    config: { ...DEFAULT_CONFIG },
    pages: [],
    currentPage: [],
    currentSection: [],
    currentSectionTitle: null,
    columnsContext: {
      active: false,
      startToken: null,
      leftColumn: [],
      rightColumn: [],
      inRightColumn: false,
    },
    pendingTags: [],
    entryContext: {
      active: false,
      startToken: null,
      content: [],
    },
  };
}

/**
 * Flush pending tags into the current context
 */
function flushTags(state: ParserState): void {
  if (state.pendingTags.length > 0) {
    const tagsNode = createTagsNode(state.pendingTags);
    addToCurrentContext(state, tagsNode);
    state.pendingTags = [];
  }
}

/**
 * Flush current section into the current context
 */
function flushSection(state: ParserState): void {
  flushTags(state);

  if (state.currentSectionTitle && state.currentSection.length > 0) {
    const sectionNode = createSectionNode(
      state.currentSectionTitle,
      state.currentSection,
    );

    if (state.columnsContext.active) {
      if (state.columnsContext.inRightColumn) {
        state.columnsContext.rightColumn.push(sectionNode);
      } else {
        state.columnsContext.leftColumn.push(sectionNode);
      }
    } else {
      state.currentPage.push(sectionNode);
    }
  } else if (state.currentSection.length > 0) {
    // Content without a section title
    for (const node of state.currentSection) {
      if (state.columnsContext.active) {
        if (state.columnsContext.inRightColumn) {
          state.columnsContext.rightColumn.push(node);
        } else {
          state.columnsContext.leftColumn.push(node);
        }
      } else {
        state.currentPage.push(node);
      }
    }
  }

  state.currentSection = [];
  state.currentSectionTitle = null;
}

/**
 * Add a node to the current parsing context
 */
function addToCurrentContext(state: ParserState, node: ContentNode): void {
  state.currentSection.push(node);
}

/**
 * Process a single token
 */
function processToken(
  state: ParserState,
  token: Token,
  tokens: Token[],
  index: number,
): void {
  switch (token.type) {
    case "config_start": {
      // Collect config tokens until config_end
      const configTokens: Token[] = [];
      let i = index + 1;
      while (i < tokens.length && tokens[i].type !== "config_end") {
        configTokens.push(tokens[i]);
        i++;
      }
      state.config = parseConfig(configTokens);
      break;
    }

    case "config_end":
      // Already handled in config_start
      break;

    case "page_start":
      // Start a new page
      state.currentPage = [];
      state.currentSection = [];
      state.currentSectionTitle = null;
      break;

    case "page_end": {
      // Flush and close current page
      flushSection(state);
      if (state.currentPage.length > 0) {
        const pageNode = createPageNode(token, state.currentPage);
        state.pages.push(pageNode);
      }
      state.currentPage = [];
      break;
    }

    case "heading": {
      const level = token.meta?.level as number;

      if (level === 1) {
        // H1 is the document header - collect following metadata
        const metadataTokens: Token[] = [];
        let i = index + 1;
        while (
          i < tokens.length &&
          (tokens[i].type === "metadata" || tokens[i].type === "text")
        ) {
          if (tokens[i].type === "metadata") {
            metadataTokens.push(tokens[i]);
          }
          i++;
        }
        const headerNode = createHeaderNode(token, metadataTokens);
        state.currentPage.push(headerNode);
      } else if (level === 2) {
        // H2 starts a new section
        flushSection(state);
        state.currentSectionTitle = token;
      }
      break;
    }

    case "entry_start": {
      // Start collecting entry content
      state.entryContext = {
        active: true,
        startToken: token,
        content: [],
      };
      break;
    }

    case "entry_end": {
      // Create entry node and add to current context
      if (state.entryContext.active && state.entryContext.startToken) {
        const entryNode = createEntryNode(
          state.entryContext.startToken,
          state.entryContext.content,
        );
        addToCurrentContext(state, entryNode);
      }
      state.entryContext = {
        active: false,
        startToken: null,
        content: [],
      };
      break;
    }

    case "columns_start": {
      // Flush current section and start columns
      flushSection(state);
      state.columnsContext = {
        active: true,
        startToken: token,
        leftColumn: [],
        rightColumn: [],
        inRightColumn: false,
      };
      break;
    }

    case "columns_end": {
      // Flush and close columns
      flushSection(state);
      if (state.columnsContext.active && state.columnsContext.startToken) {
        const columnsNode = createColumnsNode(
          state.columnsContext.startToken,
          state.columnsContext.leftColumn,
          state.columnsContext.rightColumn,
        );
        state.currentPage.push(columnsNode);
      }
      state.columnsContext = {
        active: false,
        startToken: null,
        leftColumn: [],
        rightColumn: [],
        inRightColumn: false,
      };
      break;
    }

    case "divider": {
      if (state.columnsContext.active && !state.columnsContext.inRightColumn) {
        // Divider inside columns switches to right column
        flushSection(state);
        state.columnsContext.inRightColumn = true;
      } else {
        // Regular divider
        flushTags(state);
        addToCurrentContext(state, createDividerNode(token));
      }
      break;
    }

    case "tag": {
      state.pendingTags.push(token);
      break;
    }

    case "metadata": {
      // Metadata outside of header context - ignore or handle specially
      break;
    }

    case "text": {
      if (state.entryContext.active) {
        // Text inside entry
        state.entryContext.content.push(token);
      } else {
        // Regular text paragraph
        const trimmed = token.value.trim();
        if (trimmed && !trimmed.startsWith("-")) {
          addToCurrentContext(state, createParagraphNode(trimmed, token));
        }
      }
      break;
    }
  }
}

/**
 * Parse PMDXJS source into AST
 */
export function parse(source: string): DocumentNode {
  const tokens = tokenize(source);
  const state = createInitialState();

  // Process tokens
  for (let i = 0; i < tokens.length; i++) {
    processToken(state, tokens[i], tokens, i);
  }

  // Flush any remaining content
  flushSection(state);

  // If there's remaining page content without page-end, create a page
  if (state.currentPage.length > 0) {
    const pageNode: PageNode = {
      type: "page",
      children: state.currentPage,
    };
    state.pages.push(pageNode);
  }

  return createDocumentNode(state.config, state.pages);
}
