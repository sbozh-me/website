/**
 * Component mapping for PMDXJS
 *
 * This module exports all available components that can be used
 * in PMDXJS documents, useful for custom component overrides.
 */

// Re-export types
export type {
  ColumnProps,
  ColumnsProps,
  DocumentProps,
  PageProps,
} from "../components";

export type {
  AchievementProps,
  DividerProps,
  EntryProps,
  HeaderProps,
  LanguageItem,
  LanguagesProps,
  SectionProps,
  SummaryProps,
  TagProps,
  TagsProps,
  WatermarkProps,
} from "../components/cv";

// Layout components
export { Column, Columns, Document, Page } from "../components";

// CV components
export {
  Achievement,
  Divider,
  Entry,
  Header,
  Languages,
  Section,
  Summary,
  Tag,
  Tags,
  Watermark,
} from "../components/cv";
