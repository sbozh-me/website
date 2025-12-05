import { parse as baseParse } from "./index";
import { tokenize as baseTokenize } from "./tokenizer";

import type { Token } from "./tokenizer";
import type { ContentNode, DocumentNode } from "../types/ast";

/**
 * Custom directive definition
 */
export interface DirectiveDefinition {
  /**
   * Name of the directive (used as node type)
   */
  name: string;
  /**
   * Regex pattern to match the directive
   * Should match lines like `:::button Click me` or `:::social github | linkedin`
   */
  pattern: RegExp;
  /**
   * Parse matched groups into node properties
   */
  parse: (match: RegExpMatchArray, line: string) => Record<string, unknown>;
}

/**
 * Custom node type for extended directives
 */
export interface CustomNode {
  type: string;
  props: Record<string, unknown>;
  position?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}

/**
 * Extended parser options
 */
export interface ExtendedParserOptions {
  directives: DirectiveDefinition[];
}

/**
 * Extensible parser instance
 */
export interface ExtensibleParser {
  /**
   * Register a custom directive
   */
  extend: (directive: DirectiveDefinition) => ExtensibleParser;
  /**
   * Parse source with custom directives
   */
  parse: (source: string) => DocumentNode;
  /**
   * Tokenize source with custom directives
   */
  tokenize: (source: string) => Token[];
  /**
   * Get registered directives
   */
  getDirectives: () => DirectiveDefinition[];
}

/**
 * Create a custom token type for extended directives
 */
function createCustomToken(
  directive: DirectiveDefinition,
  match: RegExpMatchArray,
  line: string,
  lineNumber: number,
): Token {
  return {
    type: `custom_${directive.name}` as Token["type"],
    value: line,
    meta: {
      directiveName: directive.name,
      ...directive.parse(match, line),
    },
    line: lineNumber,
    column: 1,
  };
}

/**
 * Create an extensible parser with support for custom directives
 *
 * @example
 * ```typescript
 * const parser = createParser()
 *   .extend({
 *     name: "button",
 *     pattern: /^:::button\s+(.+)$/,
 *     parse: (match) => ({ label: match[1] }),
 *   })
 *   .extend({
 *     name: "social",
 *     pattern: /^:::social\s+(.+)\s+\|\s+(.+)$/,
 *     parse: (match) => ({ github: match[1], linkedin: match[2] }),
 *   });
 *
 * const ast = parser.parse(source);
 * ```
 */
export function createParser(): ExtensibleParser {
  const directives: DirectiveDefinition[] = [];

  const parser: ExtensibleParser = {
    extend(directive: DirectiveDefinition): ExtensibleParser {
      directives.push(directive);
      return parser;
    },

    getDirectives(): DirectiveDefinition[] {
      return [...directives];
    },

    tokenize(source: string): Token[] {
      if (directives.length === 0) {
        return baseTokenize(source);
      }

      const lines = source.split("\n");
      const tokens: Token[] = [];
      const _context = { inConfig: false, inEntry: false, inCustom: false };

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        if (!trimmed) continue;

        // Check custom directives first
        let matched = false;
        for (const directive of directives) {
          const match = trimmed.match(directive.pattern);
          if (match) {
            tokens.push(createCustomToken(directive, match, trimmed, i + 1));
            matched = true;
            break;
          }
        }

        if (!matched) {
          // Fall back to base tokenizer for this line
          const baseTokens = baseTokenize(line);
          // Adjust line numbers
          for (const token of baseTokens) {
            token.line = i + 1;
            tokens.push(token);
          }
        }
      }

      return tokens;
    },

    parse(source: string): DocumentNode {
      if (directives.length === 0) {
        return baseParse(source);
      }

      // For now, use base parser and inject custom nodes
      // Custom tokens are converted to custom nodes in the AST
      const tokens = parser.tokenize(source);

      // Pre-process: convert custom tokens to text with markers
      // Then parse with base parser and post-process to inject custom nodes
      const preprocessed = preprocessCustomTokens(source, tokens, directives);
      const ast = baseParse(preprocessed.source);

      // Inject custom nodes at marker positions
      injectCustomNodes(ast, preprocessed.customNodes);

      return ast;
    },
  };

  return parser;
}

/**
 * Preprocess source to mark custom directive positions
 */
function preprocessCustomTokens(
  source: string,
  tokens: Token[],
  _directives: DirectiveDefinition[],
): { source: string; customNodes: Map<string, CustomNode> } {
  const customNodes = new Map<string, CustomNode>();
  const lines = source.split("\n");
  const processedLines: string[] = [];

  let customIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const customToken = tokens.find(
      (t) => t.line === lineNum && t.type.toString().startsWith("custom_"),
    );

    if (customToken && customToken.meta) {
      // Create marker and store custom node
      const markerId = `__pmdxjs_custom_${customIndex}__`;
      const nodeName = customToken.meta.directiveName as string;

      // Remove directiveName from props
      const { directiveName: _, ...props } = customToken.meta;

      customNodes.set(markerId, {
        type: nodeName,
        props,
        position: {
          start: { line: lineNum, column: 1 },
          end: { line: lineNum, column: 1 },
        },
      });

      // Replace line with a text marker that base parser will handle
      processedLines.push(markerId);
      customIndex++;
    } else {
      processedLines.push(lines[i]);
    }
  }

  return {
    source: processedLines.join("\n"),
    customNodes,
  };
}

/**
 * Inject custom nodes into the AST at marker positions
 */
function injectCustomNodes(
  ast: DocumentNode,
  customNodes: Map<string, CustomNode>,
): void {
  for (const page of ast.children) {
    injectIntoChildren(page.children, customNodes);
  }
}

/**
 * Recursively inject custom nodes into content children
 */
function injectIntoChildren(
  children: ContentNode[],
  customNodes: Map<string, CustomNode>,
): void {
  for (let i = 0; i < children.length; i++) {
    const node = children[i];

    // Check if this is a paragraph containing a marker
    if (node.type === "paragraph" && node.children.length === 1) {
      const textChild = node.children[0];
      if (textChild.type === "text") {
        const marker = textChild.value.trim();
        const customNode = customNodes.get(marker);

        if (customNode) {
          // Replace paragraph with custom node
          children[i] = customNode as unknown as ContentNode;
          continue;
        }
      }
    }

    // Recurse into nodes with children
    if ("children" in node && Array.isArray(node.children)) {
      injectIntoChildren(node.children as ContentNode[], customNodes);
    }
  }
}

/**
 * Default parser instance (no extensions)
 */
export const defaultParser = createParser();
