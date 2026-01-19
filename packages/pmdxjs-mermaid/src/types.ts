import type { MermaidConfig } from "mermaid";
import type { ComponentType } from "react";

/**
 * Mermaid plugin configuration options
 */
export interface MermaidPluginOptions {
  /**
   * Mermaid theme (default, dark, forest, neutral)
   * @default "dark"
   */
  theme?: "default" | "dark" | "forest" | "neutral";

  /**
   * Custom loading component
   */
  LoadingComponent?: ComponentType;

  /**
   * Custom error component
   */
  ErrorComponent?: ComponentType<{ error: Error }>;

  /**
   * Additional Mermaid config
   */
  mermaidConfig?: MermaidConfig;
}

/**
 * Props passed to the Mermaid component
 */
export interface MermaidProps {
  /**
   * The mermaid diagram source code
   */
  content: string;

  /**
   * The language identifier (mermaid or mmd)
   */
  language: string;

  /**
   * Optional CSS class name
   */
  className?: string;
}

/**
 * Internal props for the Mermaid component with options
 */
export interface MermaidComponentProps extends MermaidProps {
  options?: MermaidPluginOptions;
}
