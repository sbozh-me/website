import type { ComponentType } from "react";

/**
 * Props passed to code block plugin components
 */
export interface CodeBlockProps {
  /** The raw code content */
  content: string;
  /** The language identifier */
  language: string;
  /** Additional className for styling */
  className?: string;
}

/**
 * Code language plugin interface for custom code block rendering
 */
export interface CodeLanguagePlugin {
  /**
   * Languages this plugin handles (e.g., ["mermaid", "mmd"])
   * Matching is case-insensitive
   */
  languages: string[];

  /**
   * React component to render the code block
   */
  component: ComponentType<CodeBlockProps>;

  /**
   * Optional: Transform content before rendering
   */
  transform?: (content: string) => string;
}
