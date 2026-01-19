import { createElement } from "react";

import { Mermaid } from "./components/Mermaid";

import type { CodeLanguagePlugin } from "@sbozh/pmdxjs";
import type { MermaidPluginOptions } from "./types";

/**
 * Create a Mermaid plugin with custom options
 *
 * @example
 * ```typescript
 * const customPlugin = createMermaidPlugin({
 *   theme: "forest",
 *   LoadingComponent: () => <Spinner />,
 * });
 *
 * compile(source, { codeLanguages: [customPlugin] });
 * ```
 */
export function createMermaidPlugin(
  options: MermaidPluginOptions = {},
): CodeLanguagePlugin {
  return {
    languages: ["mermaid", "mmd"],
    component: (props) =>
      createElement(Mermaid, {
        content: props.content,
        language: props.language,
        className: props.className,
        options,
      }),
  };
}

/**
 * Default Mermaid plugin with dark theme
 *
 * @example
 * ```typescript
 * import { compile } from "@sbozh/pmdxjs";
 * import { mermaidPlugin } from "@sbozh/pmdxjs-mermaid";
 *
 * const result = compile(source, {
 *   codeLanguages: [mermaidPlugin],
 * });
 * ```
 */
export const mermaidPlugin = createMermaidPlugin();
