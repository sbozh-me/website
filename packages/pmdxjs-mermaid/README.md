# @sbozh/pmdxjs-mermaid

Mermaid diagram plugin for PMDXJS.

## Installation

```bash
pnpm add @sbozh/pmdxjs-mermaid
```

## Usage

### Basic Usage

```typescript
import { compile } from "@sbozh/pmdxjs";
import { mermaidPlugin } from "@sbozh/pmdxjs-mermaid";

const source = `
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
`;

const result = compile(source, {
  codeLanguages: [mermaidPlugin],
});
```

### With Custom Options

```typescript
import { createMermaidPlugin } from "@sbozh/pmdxjs-mermaid";

const customPlugin = createMermaidPlugin({
  theme: "forest",
  LoadingComponent: () => <Spinner />,
  ErrorComponent: ({ error }) => <Alert variant="error">{error.message}</Alert>,
  mermaidConfig: {
    securityLevel: "strict",
  },
});

const result = compile(source, {
  codeLanguages: [customPlugin],
});
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `theme` | `"default" \| "dark" \| "forest" \| "neutral"` | `"dark"` | Mermaid theme |
| `LoadingComponent` | `ComponentType` | Built-in | Custom loading component |
| `ErrorComponent` | `ComponentType<{ error: Error }>` | Built-in | Custom error component |
| `mermaidConfig` | `MermaidConfig` | `{}` | Additional Mermaid config |

## Supported Languages

- `mermaid`
- `mmd`

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

## SSR Considerations

This plugin renders diagrams client-side only. On the server, a loading state is shown, and the actual diagram renders after hydration.

## Bundle Size

~80-100KB gzipped (mermaid library).
