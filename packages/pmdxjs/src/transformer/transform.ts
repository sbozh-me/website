import { createElement } from "react";

import { Column, Columns, Document, Page } from "../components";

import type {
  ColumnNode,
  ColumnsNode,
  ContentNode,
  DividerNode,
  DocumentNode,
  EntryNode,
  HeaderNode,
  PageNode,
  ParagraphNode,
  SectionNode,
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
  };
}

/**
 * Default components for rendering (placeholder implementations)
 * These will be replaced with full CV components in 0.4.2
 */
const DefaultHeader = ({ name, subtitle, contact }: HeaderNode) =>
  createElement(
    "header",
    { className: "pmdxjs-header mb-6" },
    createElement("h1", { className: "text-3xl font-bold" }, name),
    subtitle &&
      createElement("p", { className: "text-xl text-gray-600" }, subtitle),
    contact &&
      createElement(
        "p",
        { className: "text-sm text-gray-500 mt-2" },
        contact.join(" | "),
      ),
  );

const DefaultSection = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) =>
  createElement(
    "section",
    { className: "pmdxjs-section mb-6" },
    createElement(
      "h2",
      { className: "text-xl font-semibold mb-3 border-b pb-1" },
      title,
    ),
    children,
  );

const DefaultEntry = ({
  company,
  role,
  dates,
  location,
  children,
}: EntryNode) =>
  createElement(
    "article",
    { className: "pmdxjs-entry mb-4" },
    createElement(
      "div",
      { className: "flex justify-between items-baseline" },
      createElement(
        "div",
        null,
        createElement("span", { className: "font-semibold" }, company),
        createElement("span", { className: "text-gray-400 mx-2" }, "|"),
        createElement("span", null, role),
      ),
      createElement(
        "div",
        { className: "text-sm text-gray-500" },
        dates,
        location && ` | ${location}`,
      ),
    ),
    createElement("div", { className: "mt-2" }, children),
  );

const DefaultTags = ({ items }: { items: string[] }) =>
  createElement(
    "div",
    { className: "pmdxjs-tags flex flex-wrap gap-2" },
    ...items.map((item, i) =>
      createElement(
        "span",
        {
          key: i,
          className:
            "inline-block px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700",
        },
        item,
      ),
    ),
  );

const DefaultDivider = () =>
  createElement("hr", { className: "pmdxjs-divider my-4 border-gray-200" });

const DefaultParagraph = ({ children }: { children: ReactNode }) =>
  createElement("p", { className: "pmdxjs-paragraph mb-2" }, children);

/**
 * Transform inline text node to React element
 */
function transformText(node: TextNode): string {
  return node.value;
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
  const children = node.children.map((child) => {
    if (child.type === "text") {
      return transformText(child);
    }
    // Handle other inline types (strong, emphasis, link) in future
    return null;
  });

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
  const DividerComponent = options.components?.Divider ?? DefaultDivider;
  return createElement(DividerComponent, { key });
}

/**
 * Transform a tags node to React element
 */
function transformTags(
  node: TagsNode,
  options: TransformOptions,
  key: number,
): ReactElement {
  const TagsComponent = options.components?.Tags ?? DefaultTags;
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
  const EntryComponent = options.components?.Entry ?? DefaultEntry;
  const children = node.children.map((child, i) =>
    transformContentNode(child, options, i),
  );

  return createElement(EntryComponent, {
    key,
    type: "entry",
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
  const HeaderComponent = options.components?.Header ?? DefaultHeader;
  return createElement(HeaderComponent, {
    key,
    type: "header",
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
  const SectionComponent = options.components?.Section ?? DefaultSection;
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
  width?: number,
): ReactElement {
  const ColumnComponent = options.components?.Column ?? Column;
  const children = node.children.map((child, i) =>
    transformContentNode(child, options, i),
  );

  return createElement(ColumnComponent, { key, width, children });
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
  const [leftRatio, rightRatio] = node.ratio;
  const total = leftRatio + rightRatio;

  const children = node.children.map((child, i) => {
    const width =
      i === 0 ? (leftRatio / total) * 100 : (rightRatio / total) * 100;
    return transformColumn(child, options, i, width);
  });

  return createElement(ColumnsComponent, { key, ratio: node.ratio, children });
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
    case "entry":
      return transformEntry(node, options, key);
    case "tags":
      return transformTags(node, options, key);
    case "divider":
      return transformDivider(node, options, key);
    case "paragraph":
      return transformParagraph(node, options, key);
    default:
      return null;
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
