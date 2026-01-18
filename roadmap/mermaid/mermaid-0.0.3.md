# mermaid-0.0.3 - Mermaid Plugin Package

## Goal

Create a standalone `@sbozh/pmdxjs-mermaid` package that provides Mermaid diagram rendering as a PMDXJS code language plugin.

## Deliverables

- [ ] New package `@sbozh/pmdxjs-mermaid`
- [ ] Mermaid rendering component with async initialization
- [ ] SSR-safe implementation (client-only rendering)
- [ ] Loading and error states
- [ ] Theme configuration support
- [ ] Unit tests and documentation

## Dependencies

Requires [mermaid-0.0.2 - Code Language Plugin System](./mermaid-0.0.2.md)

## Files to Create

```
packages/pmdxjs-mermaid/
  package.json
  tsconfig.json
  vitest.config.ts
  README.md
  src/
    index.ts              # Main export
    plugin.ts             # Plugin definition
    components/
      Mermaid.tsx         # Main component
      MermaidClient.tsx   # Client-only renderer
      Loading.tsx         # Loading state
      Error.tsx           # Error state
    hooks/
      useMermaid.ts       # Mermaid initialization hook
    types.ts              # Type definitions
    __tests__/
      plugin.test.ts
      Mermaid.test.tsx
```

## Package Configuration

```json
{
  "name": "@sbozh/pmdxjs-mermaid",
  "version": "1.0.0",
  "description": "Mermaid diagram plugin for PMDXJS",
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "peerDependencies": {
    "@sbozh/pmdxjs": "workspace:*",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "dependencies": {
    "mermaid": "^11.4.0"
  },
  "devDependencies": {
    "@sbozh/typescript-config": "workspace:*",
    "@sbozh/eslint-config": "workspace:*",
    "@testing-library/react": "^16.0.0",
    "vitest": "^4.0.15",
    "typescript": "^5.7.2"
  }
}
```

## Type Definitions

```typescript
// types.ts
export interface MermaidPluginOptions {
  /**
   * Mermaid theme (default, dark, forest, neutral)
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

export interface MermaidProps {
  content: string;
  language: string;
  className?: string;
}
```

## Plugin Implementation

```typescript
// plugin.ts
import { CodeLanguagePlugin } from "@sbozh/pmdxjs";
import { Mermaid } from "./components/Mermaid";
import { MermaidPluginOptions } from "./types";

export function createMermaidPlugin(
  options: MermaidPluginOptions = {}
): CodeLanguagePlugin {
  return {
    languages: ["mermaid", "mmd"],
    component: (props) => <Mermaid {...props} options={options} />,
  };
}

// Convenience export with defaults
export const mermaidPlugin = createMermaidPlugin();
```

## Component Implementation

```typescript
// components/Mermaid.tsx
"use client";

import { useEffect, useRef, useState, useId } from "react";
import mermaid from "mermaid";

export function Mermaid({ content, className, options }: MermaidComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const id = useId().replace(/:/g, "_");

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: options?.theme ?? "dark",
          ...options?.mermaidConfig,
        });

        const { svg } = await mermaid.render(`mermaid-${id}`, content);

        if (!cancelled) {
          setSvg(svg);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      }
    }

    render();
    return () => { cancelled = true; };
  }, [content, id, options]);

  if (loading) {
    const Loading = options?.LoadingComponent ?? DefaultLoading;
    return <Loading />;
  }

  if (error) {
    const ErrorComponent = options?.ErrorComponent ?? DefaultError;
    return <ErrorComponent error={error} />;
  }

  return (
    <div
      ref={containerRef}
      className={className}
      dangerouslySetInnerHTML={{ __html: svg! }}
    />
  );
}
```

## API Design

### Basic Usage

```typescript
import { compile } from "@sbozh/pmdxjs";
import { mermaidPlugin } from "@sbozh/pmdxjs-mermaid";

const result = compile(source, {
  codeLanguages: [mermaidPlugin],
});
```

### With Configuration

```typescript
import { createMermaidPlugin } from "@sbozh/pmdxjs-mermaid";

const customMermaidPlugin = createMermaidPlugin({
  theme: "forest",
  LoadingComponent: () => <Spinner />,
  ErrorComponent: ({ error }) => <Alert variant="error">{error.message}</Alert>,
  mermaidConfig: {
    securityLevel: "strict",
  },
});

const result = compile(source, {
  codeLanguages: [customMermaidPlugin],
});
```

## Demo

```markdown
:::page

# Architecture

\`\`\`mermaid
graph TD
    A[Client] --> B[Next.js]
    B --> C[PMDXJS]
    C --> D[Mermaid Plugin]
    D --> E[SVG Output]
\`\`\`

:::page-end
```

## SSR Considerations

1. **No SSR rendering** - Mermaid requires DOM, render placeholder on server
2. **Hydration safe** - Use `useEffect` for client-only rendering
3. **Loading state** - Show skeleton while mermaid initializes
4. **Bundle impact** - ~80-100KB gzipped (only loaded when plugin used)

## Supported Diagram Types

- Flowcharts (`graph TD`, `flowchart LR`)
- Sequence diagrams
- Class diagrams
- State diagrams
- Entity Relationship diagrams
- Gantt charts
- Pie charts
- Git graphs
- Mindmaps
- Timeline

## Acceptance Criteria

- [ ] Package builds and publishes correctly
- [ ] Plugin integrates with PMDXJS code language system
- [ ] Diagrams render correctly on client
- [ ] Loading state shown during initialization
- [ ] Errors handled gracefully with error boundary
- [ ] Theme configuration works
- [ ] No hydration mismatches
- [ ] Package size documented
- [ ] README with usage examples
- [ ] `pnpm test` passes
- [ ] `pnpm build` succeeds
- [ ] Test coverage >= 90%
