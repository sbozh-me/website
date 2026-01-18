# mermaid-0.0.2 - Code Language Plugin System

## Goal

Create an extensible plugin system for code block rendering, allowing language-specific handlers to be registered without modifying core PMDXJS.

## Deliverables

- [ ] `CodeLanguagePlugin` interface definition
- [ ] Plugin registry in transform options
- [ ] Plugin resolution logic (language match -> plugin -> fallback)
- [ ] Export plugin types for external packages
- [ ] Documentation for plugin authors

## Dependencies

Requires [mermaid-0.0.1 - Code Block Parsing Support](./mermaid-0.0.1.md)

## Files to Modify

```
packages/pmdxjs/src/
  types/
    index.ts            # Export plugin types
    plugins.ts          # NEW: Plugin interface definitions
  transformer/
    transform.ts        # Add plugin resolution
    code-plugins.ts     # NEW: Plugin registry and resolution
  __tests__/
    transformer/
      code-plugins.test.ts  # Plugin system tests
```

## Type Definitions

```typescript
// types/plugins.ts
export interface CodeLanguagePlugin {
  /**
   * Languages this plugin handles (e.g., ["mermaid", "mmd"])
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

export interface CodeBlockProps {
  /** The raw code content */
  content: string;
  /** The language identifier */
  language: string;
  /** Additional className for styling */
  className?: string;
}

// Extended transform options
export interface TransformOptions {
  components?: KnownComponents & CustomComponents;
  codeLanguages?: CodeLanguagePlugin[];  // NEW
}
```

## Plugin Resolution

```typescript
// transformer/code-plugins.ts
export function resolveCodePlugin(
  language: string | null,
  plugins: CodeLanguagePlugin[]
): CodeLanguagePlugin | null {
  if (!language) return null;

  const normalizedLang = language.toLowerCase();

  for (const plugin of plugins) {
    if (plugin.languages.includes(normalizedLang)) {
      return plugin;
    }
  }

  return null;
}
```

## Transformer Integration

```typescript
// transformer/transform.ts
function transformCodeBlock(
  node: CodeBlockNode,
  options: TransformOptions
): ReactElement {
  const { codeLanguages = [], components } = options;

  // Try to find a plugin for this language
  const plugin = resolveCodePlugin(node.language, codeLanguages);

  if (plugin) {
    const content = plugin.transform
      ? plugin.transform(node.content)
      : node.content;

    return createElement(plugin.component, {
      content,
      language: node.language!,
      className: `language-${node.language}`,
    });
  }

  // Fallback to default or custom CodeBlock component
  const CodeBlock = components?.CodeBlock ?? DefaultCodeBlock;
  return createElement(CodeBlock, {
    language: node.language,
    children: node.content,
  });
}
```

## API Design

### Registering Plugins

```typescript
import { compile } from "@sbozh/pmdxjs";
import { mermaidPlugin } from "@sbozh/pmdxjs-mermaid";
import { shikiPlugin } from "@sbozh/pmdxjs-shiki"; // hypothetical

const result = compile(source, {
  codeLanguages: [
    mermaidPlugin,
    shikiPlugin,
  ],
});
```

### Creating a Plugin

```typescript
// Example: Simple syntax highlighter plugin
import { CodeLanguagePlugin } from "@sbozh/pmdxjs";
import { highlight } from "some-highlighter";

export const highlightPlugin: CodeLanguagePlugin = {
  languages: ["typescript", "javascript", "ts", "js"],
  component: ({ content, language }) => (
    <pre className={`language-${language}`}>
      <code dangerouslySetInnerHTML={{ __html: highlight(content, language) }} />
    </pre>
  ),
};
```

## Demo

```typescript
import { compile } from "@sbozh/pmdxjs";

// Custom inline plugin
const jsonPlugin = {
  languages: ["json"],
  component: ({ content }) => (
    <pre style={{ background: "#1e1e1e", color: "#d4d4d4" }}>
      <code>{JSON.stringify(JSON.parse(content), null, 2)}</code>
    </pre>
  ),
  transform: (content) => content.trim(),
};

const result = compile(`
:::page
\`\`\`json
{"name":"John","age":30}
\`\`\`
:::page-end
`, {
  codeLanguages: [jsonPlugin],
});
```

## Plugin Priority

1. Plugins checked in array order (first match wins)
2. More specific languages can override general ones
3. No plugin found -> use default `<pre><code>` component
4. Custom `components.CodeBlock` used as final fallback

## Acceptance Criteria

- [ ] `CodeLanguagePlugin` interface exported from package
- [ ] Plugins can register for multiple language aliases
- [ ] Plugin resolution respects array order
- [ ] Fallback to default component works
- [ ] Transform function applied when provided
- [ ] Plugin system documented in README
- [ ] `pnpm test` passes
- [ ] `pnpm build` succeeds
- [ ] Test coverage >= 90%
