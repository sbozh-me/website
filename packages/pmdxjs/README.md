# @sbozh/pmdxjs

A custom markdown-to-JSX parser for CV/resume rendering with page layout awareness.

## Features

- **Custom Syntax**: Extended markdown with directives for CV-specific elements
- **Inline Formatting**: Bold, italic, links, and branded spark `{*}` marker
- **Page Layout**: A4/Letter format support with configurable margins
- **Two-Column Layout**: Ratio-based column system for complex layouts
- **PDF Export**: Generate downloadable PDFs via Puppeteer
- **SSR + Browser**: Works with Next.js SSR and browser runtime

## Installation

```bash
pnpm add @sbozh/pmdxjs
```

## Quick Start

```typescript
import { compile } from "@sbozh/pmdxjs";

const source = `
:::config
format: A4
margins: 10 10 10 10
:::

:::page
# John Doe
subtitle: Software Engineer | [github.com/johndoe](https://github.com/johndoe)
contact: john@example.com | +1-555-0100 | San Francisco

---

## Experience

:::entry ACME Corp | Lead Developer | 2020-Present | Remote
- Led team of 5 engineers on critical payment infrastructure
- Reduced deployment time by 40% through CI/CD improvements
:::

## Skills

#tag TypeScript
#tag React
#tag Node.js

:::page-end
`;

const { element, error } = compile(source);
```

## Syntax Reference

### Config Block

```markdown
:::config
format: A4 | Letter
margins: top right bottom left
:::
```

### Page Block

```markdown
:::page
Content here...
:::page-end
```

### Header (H1)

```markdown
# Name
subtitle: Job Title | Additional Info
contact: email@example.com | +1-555-0100 | Location
```

Contact items are auto-linked: emails get `mailto:`, phone numbers get `tel:`, URLs open in new tabs.

### Section (H2)

```markdown
## Section Title
Content...
```

### Entry (Job/Education)

```markdown
:::entry Company | Role | Dates | Location
- Achievement one
- Achievement two
:::
```

### Columns

```markdown
---columns 66 34

Left column content (66%)

---

Right column content (34%)

---columns-end
```

### Tags

```markdown
#tag TypeScript
#tag React
#tag Node.js
```

### Inline Formatting

```markdown
**bold text**
*italic text*
[link text](https://example.com)
{*}  <!-- Branded spark marker (purple/gold asterisk) -->
```

### Divider

```markdown
---
```

## Components

### Layout Components

```typescript
import { Document, Page, Columns, Column } from "@sbozh/pmdxjs/components";
```

### CV Components

```typescript
import { Header, Section, Entry, Tags, Divider } from "@sbozh/pmdxjs/components/cv";
```

- **Header** - Name, subtitle, contact info with auto-linking
- **Section** - Titled content blocks
- **Entry** - Job/education entries with company, role, dates, location
- **Tags** - Skill badges
- **Divider** - Visual separator

## Browser Runtime

Live editing with real-time preview:

```typescript
import { usePMDXJS } from "@sbozh/pmdxjs/hooks";

function CVEditor() {
  const [source, setSource] = useState(defaultCV);
  const { element, loading, error } = usePMDXJS(source);

  return (
    <div className="flex gap-4">
      <textarea
        value={source}
        onChange={(e) => setSource(e.target.value)}
        className="flex-1 font-mono"
      />
      <div className="flex-1">
        {loading && <div>Compiling...</div>}
        {error && <div className="text-red-500">{error.message}</div>}
        {element}
      </div>
    </div>
  );
}
```

## Extensible Parser

Register custom directives for domain-specific syntax:

```typescript
import { createParser } from "@sbozh/pmdxjs/parser";
import { transform } from "@sbozh/pmdxjs/transformer";

const parser = createParser()
  .extend({
    name: "button",
    pattern: /^:::button\s+(.+)$/,
    parse: (match) => ({ label: match[1] }),
  });

const ast = parser.parse(source);
const element = transform(ast, {
  components: {
    button: ({ label }) => <button>{label}</button>,
  },
});
```

## Exports

| Export | Description |
|--------|-------------|
| `@sbozh/pmdxjs` | Main entry with `compile()` |
| `@sbozh/pmdxjs/parser` | `parse()`, `createParser()` |
| `@sbozh/pmdxjs/transformer` | `transform()` |
| `@sbozh/pmdxjs/components` | Document, Page, Columns, Column |
| `@sbozh/pmdxjs/components/cv` | Header, Section, Entry, Tags, Divider |
| `@sbozh/pmdxjs/hooks` | `usePMDXJS()` |
| `@sbozh/pmdxjs/types` | TypeScript types |

## License

MIT
