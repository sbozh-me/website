import { createElement } from "react";

import { Column, Columns, Document, Page } from "../components";
import {
  Divider as CVDivider,
  Entry as CVEntry,
  Header as CVHeader,
  Section as CVSection,
  Tags as CVTags,
} from "../components/cv";

import type {
  ColumnNode,
  ColumnsNode,
  ContentNode,
  DividerNode,
  DocumentNode,
  EmphasisNode,
  EntryNode,
  HeaderNode,
  InlineNode,
  LinkNode,
  ListItemNode,
  ListNode,
  PageNode,
  ParagraphNode,
  SectionNode,
  StrongNode,
  TagsNode,
  TextNode,
} from "../types/ast";
import type { ReactElement, ReactNode } from "react";

/**
 * Transform options
 */
export interface TransformOptions {
  /**
   * Custom component overrides
   */
  components?: {
    Document?: React.ComponentType<{
      config: DocumentNode["config"];
      children: ReactNode;
    }>;
    Page?: React.ComponentType<{ children: ReactNode }>;
    Columns?: React.ComponentType<{
      ratio: [number, number];
      children: ReactNode;
    }>;
    Column?: React.ComponentType<{ width?: number; children: ReactNode }>;
    Header?: React.ComponentType<HeaderNode>;
    Section?: React.ComponentType<{ title: string; children: ReactNode }>;
    Entry?: React.ComponentType<EntryNode>;
    Tags?: React.ComponentType<{ items: string[] }>;
    Divider?: React.ComponentType<Record<string, never>>;
    Paragraph?: React.ComponentType<{ children: ReactNode }>;
    List?: React.ComponentType<{ ordered: boolean; children: ReactNode }>;
    ListItem?: React.ComponentType<{ children: ReactNode }>;
    // Allow any custom component for extended directives
    [key: string]: React.ComponentType<Record<string, unknown>> | undefined;
  };
}

/**
 * Default paragraph component (simple, not CV-specific)
 */
const DefaultParagraph = ({ children }: { children: ReactNode }) =>
  createElement("p", { className: "pmdxjs-paragraph mb-2" }, children);

/**
 * Default list component
 */
const DefaultList = ({
  ordered,
  children,
}: {
  ordered: boolean;
  children: ReactNode;
}) =>
  createElement(
    ordered ? "ol" : "ul",
    {
      className: `pmdxjs-list ${ordered ? "list-decimal" : "list-disc"} pl-4 space-y-0.5 text-[10px]`,
    },
    children,
  );

/**
 * Default list item component
 */
const DefaultListItem = ({ children }: { children: ReactNode }) =>
  createElement("li", { className: "pmdxjs-list-item" }, children);

/**
 * Transform inline text node to React element
 */
function transformText(node: TextNode): string {
  return node.value;
}

/**
 * Transform strong (bold) node to React element
 */
function transformStrong(node: StrongNode, key: number): ReactElement {
  const children = node.children.map((child, i) => transformInlineNode(child, i));
  return createElement("strong", { key, className: "font-bold" }, children);
}

/**
 * Transform emphasis (italic) node to React element
 */
function transformEmphasis(node: EmphasisNode, key: number): ReactElement {
  const children = node.children.map((child, i) => transformInlineNode(child, i));
  return createElement("em", { key, className: "italic" }, children);
}

/**
 * Transform link node to React element
 */
function transformLink(node: LinkNode, key: number): ReactElement {
  const children = node.children.map((child, i) => transformInlineNode(child, i));
  return createElement(
    "a",
    {
      key,
      href: node.url,
      className: "text-blue-600 underline hover:text-blue-800",
      target: "_blank",
      rel: "noopener noreferrer",
    },
    children,
  );
}

/**
 * Transform any inline node to React element
 */
function transformInlineNode(
  node: InlineNode,
  key: number,
): ReactElement | string {
  switch (node.type) {
    case "text":
      return transformText(node);
    case "strong":
      return transformStrong(node, key);
    case "emphasis":
      return transformEmphasis(node, key);
    case "link":
      return transformLink(node, key);
    default:
      return "";
  }
}

/**
 * Transform a paragraph node to React element
 */
function transformParagraph(
  node: ParagraphNode,
  options: TransformOptions,
  key: number,
): ReactElement {
  const ParagraphComponent = options.components?.Paragraph ?? DefaultParagraph;
  const children = node.children.map((child, i) => transformInlineNode(child, i));

  return createElement(ParagraphComponent, { key, children });
}

/**
 * Transform a divider node to React element
 */
function transformDivider(
  _node: DividerNode,
  options: TransformOptions,
  key: number,
): ReactElement {
  const DividerComponent = options.components?.Divider ?? CVDivider;
  return createElement(DividerComponent, { key });
}

/**
 * Transform a list item node to React element
 */
function transformListItem(
  node: ListItemNode,
  options: TransformOptions,
  key: number,
): ReactElement {
  const ListItemComponent = options.components?.ListItem ?? DefaultListItem;
  const children = node.children.map((child, i) =>
    transformContentNode(child, options, i),
  );

  return createElement(ListItemComponent, { key, children });
}

/**
 * Transform a list node to React element
 */
function transformList(
  node: ListNode,
  options: TransformOptions,
  key: number,
): ReactElement {
  const ListComponent = options.components?.List ?? DefaultList;
  const children = node.children.map((child, i) =>
    transformListItem(child, options, i),
  );

  return createElement(ListComponent, { key, ordered: node.ordered, children });
}

/**
 * Transform a tags node to React element
 */
function transformTags(
  node: TagsNode,
  options: TransformOptions,
  key: number,
): ReactElement {
  const TagsComponent = options.components?.Tags ?? CVTags;
  return createElement(TagsComponent, { key, items: node.items });
}

/**
 * Transform an entry node to React element
 */
function transformEntry(
  node: EntryNode,
  options: TransformOptions,
  key: number,
): ReactElement {
  const EntryComponent = options.components?.Entry ?? CVEntry;
  const children = node.children.map((child, i) =>
    transformContentNode(child, options, i),
  );

  return createElement(EntryComponent, {
    key,
    company: node.company,
    role: node.role,
    dates: node.dates,
    location: node.location,
    children,
  });
}

/**
 * Transform a header node to React element
 */
function transformHeader(
  node: HeaderNode,
  options: TransformOptions,
  key: number,
): ReactElement {
  const HeaderComponent = options.components?.Header ?? CVHeader;
  return createElement(HeaderComponent, {
    key,
    name: node.name,
    subtitle: node.subtitle,
    contact: node.contact,
  });
}

/**
 * Transform a section node to React element
 */
function transformSection(
  node: SectionNode,
  options: TransformOptions,
  key: number,
): ReactElement {
  const SectionComponent = options.components?.Section ?? CVSection;
  const children = node.children.map((child, i) =>
    transformContentNode(child, options, i),
  );

  return createElement(SectionComponent, { key, title: node.title, children });
}

/**
 * Transform a column node to React element
 */
function transformColumn(
  node: ColumnNode,
  options: TransformOptions,
  key: number,
): ReactElement {
  const ColumnComponent = options.components?.Column ?? Column;
  const children = node.children.map((child, i) =>
    transformContentNode(child, options, i),
  );

  return createElement(ColumnComponent, { key, children });
}

/**
 * Transform a columns node to React element
 */
function transformColumns(
  node: ColumnsNode,
  options: TransformOptions,
  key: number,
): ReactElement {
  const ColumnsComponent = options.components?.Columns ?? Columns;

  const children = node.children.map((child, i) =>
    transformColumn(child, options, i),
  );

  return createElement(ColumnsComponent, { key, ratio: node.ratio, children });
}

/**
 * Transform a custom node to React element
 */
function transformCustomNode(
  node: Record<string, unknown>,
  options: TransformOptions,
  key: number,
): ReactElement | null {
  const nodeType = node.type as string;
  const CustomComponent = options.components?.[nodeType];

  if (!CustomComponent) {
    // No component registered for this custom type
    console.warn(`No component registered for custom node type: ${nodeType}`);
    return null;
  }

  // Pass all node properties except 'type' and 'position' as props
  const { type: _type, position: _position, props, ...rest } = node;
  const componentProps = props ?? rest;

  return createElement(CustomComponent, { key, ...componentProps });
}

/**
 * Transform a content node to React element
 */
function transformContentNode(
  node: ContentNode,
  options: TransformOptions,
  key: number,
): ReactElement | null {
  switch (node.type) {
    case "header":
      return transformHeader(node, options, key);
    case "section":
      return transformSection(node, options, key);
    case "columns":
      return transformColumns(node, options, key);
    case "column":
      return transformColumn(node, options, key);
    case "list":
      return transformList(node, options, key);
    case "entry":
      return transformEntry(node, options, key);
    case "tags":
      return transformTags(node, options, key);
    case "divider":
      return transformDivider(node, options, key);
    case "paragraph":
      return transformParagraph(node, options, key);
    default:
      // Try to handle as custom node
      return transformCustomNode(
        node as unknown as Record<string, unknown>,
        options,
        key,
      );
  }
}

/**
 * Transform a page node to React element
 */
function transformPage(
  node: PageNode,
  options: TransformOptions,
  key: number,
): ReactElement {
  const PageComponent = options.components?.Page ?? Page;
  const children = node.children.map((child, i) =>
    transformContentNode(child, options, i),
  );

  return createElement(PageComponent, { key, children });
}

/**
 * Transform a PMDXJS AST document to React elements
 */
export function transform(
  ast: DocumentNode,
  options: TransformOptions = {},
): ReactElement {
  const DocumentComponent = options.components?.Document ?? Document;
  const children = ast.children.map((page, i) =>
    transformPage(page, options, i),
  );

  return createElement(DocumentComponent, { config: ast.config, children });
}
