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
  SparkNode,
  StrongNode,
  TableCellNode,
  TableNode,
  TableRowNode,
  TagsNode,
  TextNode,
} from "../types/ast";
import type { ReactElement, ReactNode } from "react";

/**
 * Transform options
 */
/**
 * Known component types with their specific props
 */
interface KnownComponents {
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
  Header?: React.ComponentType<{
    name: string;
    subtitle?: string;
    contact?: string[];
  }>;
  Section?: React.ComponentType<{ title: string; children: ReactNode }>;
  Entry?: React.ComponentType<{
    company: string;
    companyUrl?: string;
    role: string;
    dates: string;
    location?: string;
    children: ReactNode;
  }>;
  Tags?: React.ComponentType<{ items: string[] }>;
  Divider?: React.ComponentType<object>;
  Paragraph?: React.ComponentType<{ children: ReactNode }>;
  List?: React.ComponentType<{ ordered: boolean; children: ReactNode }>;
  ListItem?: React.ComponentType<{ children: ReactNode }>;
  Table?: React.ComponentType<{
    alignments: ("left" | "center" | "right")[];
    headers: ReactNode;
    children: ReactNode;
  }>;
  TableRow?: React.ComponentType<{ children: ReactNode }>;
  TableCell?: React.ComponentType<{
    alignment?: "left" | "center" | "right";
    isHeader?: boolean;
    children: ReactNode;
  }>;
}

/**
 * Custom component map for extended directives
 */
type CustomComponents = Record<
  string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  React.ComponentType<any> | undefined
>;

export interface TransformOptions {
  /**
   * Custom component overrides
   */
  components?: KnownComponents & CustomComponents;
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
 * Default table component
 */
const DefaultTable = ({
  headers,
  children,
}: {
  alignments: ("left" | "center" | "right")[];
  headers: ReactNode;
  children: ReactNode;
}) =>
  createElement(
    "table",
    { className: "pmdxjs-table w-full border-collapse text-[10px]" },
    createElement("thead", { className: "bg-muted/50" }, headers),
    createElement("tbody", null, children),
  );

/**
 * Default table row component
 */
const DefaultTableRow = ({ children }: { children: ReactNode }) =>
  createElement("tr", { className: "pmdxjs-table-row border-b border-border" }, children);

/**
 * Default table cell component
 */
const DefaultTableCell = ({
  alignment = "left",
  isHeader = false,
  children,
}: {
  alignment?: "left" | "center" | "right";
  isHeader?: boolean;
  children: ReactNode;
}) => {
  const textAlign = alignment === "center" ? "text-center" : alignment === "right" ? "text-right" : "text-left";
  const Tag = isHeader ? "th" : "td";
  return createElement(
    Tag,
    {
      className: `pmdxjs-table-cell px-2 py-1 ${textAlign} ${isHeader ? "font-semibold" : ""}`,
    },
    children,
  );
};

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
  const children = node.children.map((child, i) =>
    transformInlineNode(child, i),
  );
  return createElement("strong", { key, className: "font-bold" }, children);
}

/**
 * Transform emphasis (italic) node to React element
 */
function transformEmphasis(node: EmphasisNode, key: number): ReactElement {
  const children = node.children.map((child, i) =>
    transformInlineNode(child, i),
  );
  return createElement("em", { key, className: "italic" }, children);
}

/**
 * Transform link node to React element
 */
function transformLink(node: LinkNode, key: number): ReactElement {
  const children = node.children.map((child, i) =>
    transformInlineNode(child, i),
  );
  return createElement(
    "a",
    {
      key,
      href: node.url,
      className: "pmdxjs-link text-primary underline hover:opacity-80",
      target: "_blank",
      rel: "noopener noreferrer",
    },
    children,
  );
}

/**
 * Transform a spark node to branded asterisk with primary/secondary color overlay
 */
function transformSpark(_node: SparkNode, key: number): ReactElement {
  return createElement(
    "span",
    { key, className: "pmdxjs-spark relative" },
    createElement(
      "span",
      {
        className: "text-primary absolute w-[50%] overflow-hidden select-none",
      },
      "*",
    ),
    createElement("span", { className: "text-secondary" }, "*"),
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
    case "spark":
      return transformSpark(node, key);
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
  const children = node.children.map((child, i) =>
    transformInlineNode(child, i),
  );

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
 * Transform a table cell node to React element
 */
function transformTableCell(
  node: TableCellNode,
  options: TransformOptions,
  key: number,
  alignment: "left" | "center" | "right" = "left",
  isHeader = false,
): ReactElement {
  const TableCellComponent = options.components?.TableCell ?? DefaultTableCell;
  const children = node.children.map((child, i) =>
    transformInlineNode(child, i),
  );

  return createElement(TableCellComponent, { key, alignment, isHeader, children });
}

/**
 * Transform a table row node to React element
 */
function transformTableRow(
  node: TableRowNode,
  options: TransformOptions,
  key: number,
  alignments: ("left" | "center" | "right")[],
  isHeader = false,
): ReactElement {
  const TableRowComponent = options.components?.TableRow ?? DefaultTableRow;
  const children = node.cells.map((cell, i) =>
    transformTableCell(cell, options, i, alignments[i] || "left", isHeader),
  );

  return createElement(TableRowComponent, { key, children });
}

/**
 * Transform a table node to React element
 */
function transformTable(
  node: TableNode,
  options: TransformOptions,
  key: number,
): ReactElement {
  const TableComponent = options.components?.Table ?? DefaultTable;
  const TableRowComponent = options.components?.TableRow ?? DefaultTableRow;
  const TableCellComponent = options.components?.TableCell ?? DefaultTableCell;

  // Transform header cells
  const headerCells = node.headers.map((cell, i) => {
    const children = cell.children.map((child, j) =>
      transformInlineNode(child, j),
    );
    return createElement(TableCellComponent, {
      key: i,
      alignment: node.alignments[i] || "left",
      isHeader: true,
      children,
    });
  });
  const headerRow = createElement(TableRowComponent, { key: "header", children: headerCells });

  // Transform data rows
  const dataRows = node.rows.map((row, i) =>
    transformTableRow(row, options, i, node.alignments, false),
  );

  return createElement(TableComponent, {
    key,
    alignments: node.alignments,
    headers: headerRow,
    children: dataRows,
  });
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
    companyUrl: node.companyUrl,
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
    case "table":
      return transformTable(node, options, key);
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
