import type { DocumentConfig } from "./config";

/**
 * Base node interface for all AST nodes
 */
export interface BaseNode {
  type: string;
  position?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}

/**
 * Root document node
 */
export interface DocumentNode extends BaseNode {
  type: "document";
  config: DocumentConfig;
  children: PageNode[];
}

/**
 * Page node - represents a single page
 */
export interface PageNode extends BaseNode {
  type: "page";
  children: ContentNode[];
}

/**
 * Header node - document header with name, subtitle, contact
 */
export interface HeaderNode extends BaseNode {
  type: "header";
  name: string;
  subtitle?: string;
  contact?: string[];
}

/**
 * Section node - titled content block (## Experience, ## Skills, etc.)
 */
export interface SectionNode extends BaseNode {
  type: "section";
  title: string;
  children: ContentNode[];
}

/**
 * Columns node - multi-column layout
 */
export interface ColumnsNode extends BaseNode {
  type: "columns";
  ratio: [number, number];
  children: ColumnNode[];
}

/**
 * Column node - single column within columns
 */
export interface ColumnNode extends BaseNode {
  type: "column";
  children: ContentNode[];
}

/**
 * Entry node - CV entry (job, education, etc.)
 */
export interface EntryNode extends BaseNode {
  type: "entry";
  company: string;
  companyUrl?: string;
  role: string;
  dates: string;
  location?: string;
  children: ContentNode[];
}

/**
 * Tags node - container for skill tags
 */
export interface TagsNode extends BaseNode {
  type: "tags";
  items: string[];
}

/**
 * Divider node - horizontal rule
 */
export interface DividerNode extends BaseNode {
  type: "divider";
}

/**
 * Paragraph node - text content
 */
export interface ParagraphNode extends BaseNode {
  type: "paragraph";
  children: InlineNode[];
}

/**
 * List node - bullet or numbered list
 */
export interface ListNode extends BaseNode {
  type: "list";
  ordered: boolean;
  children: ListItemNode[];
}

/**
 * List item node
 */
export interface ListItemNode extends BaseNode {
  type: "listItem";
  children: ContentNode[];
}

/**
 * Text node - plain text
 */
export interface TextNode extends BaseNode {
  type: "text";
  value: string;
}

/**
 * Strong node - bold text
 */
export interface StrongNode extends BaseNode {
  type: "strong";
  children: InlineNode[];
}

/**
 * Emphasis node - italic text
 */
export interface EmphasisNode extends BaseNode {
  type: "emphasis";
  children: InlineNode[];
}

/**
 * Link node - hyperlink
 */
export interface LinkNode extends BaseNode {
  type: "link";
  url: string;
  children: InlineNode[];
}

/**
 * Spark node - branded asterisk with primary/secondary color overlay
 */
export interface SparkNode extends BaseNode {
  type: "spark";
}

/**
 * Inline content nodes
 */
export type InlineNode =
  | TextNode
  | StrongNode
  | EmphasisNode
  | LinkNode
  | SparkNode;

/**
 * Block content nodes
 */
export type BlockNode =
  | HeaderNode
  | SectionNode
  | ColumnsNode
  | EntryNode
  | TagsNode
  | DividerNode
  | ParagraphNode
  | ListNode;

/**
 * All content nodes (can appear inside pages, sections, columns)
 */
export type ContentNode = BlockNode | ColumnNode;

/**
 * All possible AST node types
 */
export type ASTNode =
  | DocumentNode
  | PageNode
  | ContentNode
  | ListItemNode
  | InlineNode;
