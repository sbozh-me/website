# @sbozh/pmdxjs

A custom markdown-to-JSX parser for CV/resume rendering with page layout awareness.

## Features

- **Custom Syntax**: Extended markdown with directives for CV-specific elements
- **Page Layout**: A4/Letter format support with configurable margins
- **Two-Column Layout**: Ratio-based column system for complex layouts
- **SSR + Browser**: Works with Next.js SSR and browser runtime

## Installation

```bash
pnpm add @sbozh/pmdxjs
```

## Usage

```typescript
import { parse } from "@sbozh/pmdxjs/parser";
import { transform } from "@sbozh/pmdxjs/transformer";

const source = `
:::config
format: A4
margins: 20 20 20 20
:::

:::page
# John Doe
subtitle: Software Engineer

## Experience

:::entry ACME Corp | Lead Developer | 2020-Present | San Francisco
Led team of engineers.
:::

:::page-end
`;

const ast = parse(source);
const element = transform(ast);
```

## Syntax

### Config Block

```markdown
:::config
format: A4 | Letter
margins: top right bottom left
theme: light | dark
:::
```

### Page Block

```markdown
:::page
Content here...
:::page-end
```

### Entry (Job/Education)

```markdown
:::entry Company | Role | Dates | Location
Description content...
:::
```

### Columns

```markdown
---columns 60 40

Left column content (60%)

---

Right column content (40%)

---columns-end
```

### Tags

```markdown
#tag TypeScript
#tag React
#tag Node.js
```

## CV Components

Built-in styled components for professional CV rendering:

- **Header** - Name, subtitle, contact info
- **Section** - Titled content blocks
- **Entry** - Job/education entries with metadata
- **Tags/Tag** - Skill badges
- **Divider** - Visual separator
- **Summary** - Prose block for professional summary
- **Achievement** - Bullet point achievements
- **Languages** - Language proficiency list
- **Watermark** - Footer watermark for print

```typescript
import { Header, Entry, Tags } from "@sbozh/pmdxjs/components/cv";
```

## Browser Runtime

Live editing with real-time preview:

```typescript
import { usePMDXJS } from "@sbozh/pmdxjs/hooks";

function Editor() {
  const [source, setSource] = useState(defaultCV);
  const { element, loading, error } = usePMDXJS(source);

  return (
    <div className="flex">
      <textarea value={source} onChange={(e) => setSource(e.target.value)} />
      <div className="preview">
        {loading && <Spinner />}
        {error && <ErrorDisplay message={error.message} />}
        {element}
      </div>
    </div>
  );
}
```

## Exports

- `@sbozh/pmdxjs` - Main entry
- `@sbozh/pmdxjs/parser` - Parser functions
- `@sbozh/pmdxjs/transformer` - AST-to-JSX transformer
- `@sbozh/pmdxjs/components` - Layout components (Document, Page, Columns)
- `@sbozh/pmdxjs/components/cv` - CV-specific components
- `@sbozh/pmdxjs/runtime` - Compile functions
- `@sbozh/pmdxjs/runtime/browser` - Browser-specific runtime
- `@sbozh/pmdxjs/runtime/server` - Server-specific runtime
- `@sbozh/pmdxjs/hooks` - React hooks (usePMDXJS)
- `@sbozh/pmdxjs/types` - TypeScript types

## License

MIT
