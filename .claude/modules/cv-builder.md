# CV Builder Module (PMDXJS)

> **Role**: Custom markdown parser and CV rendering system
> **Package**: `@sbozh/pmdxjs`
> **Status**: Production
> **Critical Path**: Yes - Powers /cv route and PDF export

## Overview

PMDXJS is a custom markdown parser specifically designed for CV/resume rendering:
- **Extended syntax** for CV elements (entries, tags, columns)
- **A4/Letter layouts** with print support
- **Inline formatting** with branded `{*}` spark marker
- **PDF export** via Puppeteer microservice
- **Theme support** (light/dark modes)

## Architecture

```
CV Content (.pmdx file)
    ↓
Parser (tokenizer → AST)
    ↓
Transformer (AST → React components)
    ↓
Page Component → Browser
    ↓
PDF Service (Puppeteer) → PDF Download
```

## Key Files

| File | Purpose | Location |
|------|---------|----------|
| `index.ts` | Main compile() API | `packages/pmdxjs/src/index.ts` |
| `parser/index.ts` | Core parser logic | `packages/pmdxjs/src/parser/index.ts` |
| `tokenizer.ts` | Lexical analysis | `packages/pmdxjs/src/parser/tokenizer.ts` |
| `transformer.tsx` | AST → React | `packages/pmdxjs/src/transformer/index.tsx` |
| `Page.tsx` | Page component | `packages/pmdxjs/src/components/Page.tsx` |
| `sem-bozhyk-v0.0.1.pmdx` | CV content | `apps/web/content/sem-bozhyk-v0.0.1.pmdx` |

## PMDX Syntax

### Config Block
```markdown
:::config
format: A4
margins: 10 10 10 10
theme: dark
:::
```

### Page Block
```markdown
:::page
# Your Name
subtitle: Job Title
contact: email | phone | linkedin | location

## Section Title
Content here...
:::page-end
```

### Entry Block (Job/Education)
```markdown
:::entry Company | Role | Dates | Location
- Bullet point 1
- Bullet point 2
:::
```

### Tag/Skills
```markdown
#tag TypeScript
#tag React
#tag Node.js
```

### Columns
```markdown
---columns 66 34
Left column content (66%)
---
Right column content (34%)
---columns-end
```

### Inline Spark Marker
```markdown
Building [sbozh.me](https://sbozh.me) - a personal startup{*}.
```
Renders with purple-to-gold gradient on `*`.

## Data Flow

### 1. Compilation

```typescript
import { compile } from "@sbozh/pmdxjs";

const source = readFileSync("cv.pmdx", "utf-8");
const { element, error } = compile(source);

if (error) {
  console.error(error);
} else {
  // Render element
  return element;
}
```

### 2. Parsing Pipeline

```
Source Text
  ↓ Tokenizer
Lines/Tokens
  ↓ Parser
AST (Abstract Syntax Tree)
  ↓ Transformer
React Components
```

### 3. PDF Generation

```
1. User clicks "Download PDF"
2. Browser → /api/cv/pdf
3. API calls PDF service
4. Puppeteer renders /cv route
5. Returns PDF buffer
6. Browser downloads file
```

## Components

### Document
Root wrapper with theme context.
```tsx
<Document config={config}>
  {children}
</Document>
```

### Page
Single page with A4/Letter dimensions.
```tsx
<Page>
  {pageContent}
</Page>
```

### Header
CV header with name, subtitle, contact.
```tsx
<Header
  name="Your Name"
  subtitle="Job Title"
  contact="email | phone"
/>
```

### Entry
Job/education entry.
```tsx
<Entry
  company="Company"
  role="Role"
  dates="2020-2023"
  location="City"
>
  - Accomplishment 1
  - Accomplishment 2
</Entry>
```

### Tags
Skills/technology badges.
```tsx
<Tags>
  <Tag>TypeScript</Tag>
  <Tag>React</Tag>
</Tags>
```

## Theme System

### Colors (Obsidian Forge)
```css
--cv-paper: #0a0a0f;              /* Dark mode */
--cv-foreground: #e5e7eb;
--cv-primary: #8b5cf6;            /* Amethyst */
--cv-secondary: #f59e0b;          /* Gold */
--cv-border: #27272a;
```

### Light Mode (Print)
```css
--cv-paper: #ffffff;
--cv-foreground: #1a1a1a;
--cv-border: #e5e7eb;
```

Print automatically forces light mode for better readability.

## Page Dimensions

### A4 (Default)
- Width: 210mm
- Height: 297mm
- Margins: 10mm (configurable)

### Letter
- Width: 215.9mm
- Height: 279.4mm
- Margins: 10mm (configurable)

## Common Operations

### Update CV Content
Edit `apps/web/content/sem-bozhyk-v0.0.1.pmdx`:
```markdown
:::page
# Updated Name
subtitle: New Job Title
...
:::page-end
```
Changes appear immediately in dev mode.

### Add New Component
1. Create component in `packages/pmdxjs/src/components/cv/`
2. Add to transformer in `src/transformer/index.tsx`
3. Add styling in `apps/web/app/globals.css`

### Fix PDF Pagination
Edit `packages/pmdxjs/src/components/Page.tsx`:
- Remove `break-after-page` class to prevent blank pages
- Adjust margins/heights for content fit

### Change Theme
Component level:
```tsx
<Document config={{ theme: "light" }}>
```

Or in `.pmdx` config:
```markdown
:::config
theme: light
:::
```

## Testing

```bash
# Run PMDXJS tests
pnpm test --filter=@sbozh/pmdxjs

# Test parser
pnpm test --filter=@sbozh/pmdxjs -- parser.test.ts

# Test transformer
pnpm test --filter=@sbozh/pmdxjs -- transformer.test.ts
```

## PDF Service Integration

### Local Development
```bash
cd services/pdf-generator
pnpm dev  # Starts on http://localhost:3010
```

### API Endpoint
```typescript
GET /api/cv/pdf
→ Calls PDF service
→ Returns PDF buffer
```

### Health Check
```bash
curl http://localhost:3010/health
# → {"status":"ok"}
```

## Troubleshooting

### "Blank second page in PDF"
- Check Page component doesn't have `break-after-page` class
- Verify print CSS has `page-break-after: avoid`
- Issue was fixed 2026-01-02

### "Content overflows page"
- Adjust margins in config: `margins: 10 10 10 10`
- Reduce content or split into multiple pages
- Check `OverflowWarning` component in dev mode

### "Syntax error in parsing"
- Validate PMDX syntax (check examples in tests)
- Ensure all blocks properly closed (`:::` or `---`)
- Review tokenizer patterns in `tokenizer.ts`

### "PDF service not responding"
- Start PDF service: `cd services/pdf-generator && pnpm dev`
- Check `PDF_SERVICE_URL` env var
- Verify port 3010 not in use

## Related Documentation

- Integration: `integrations/pdf-service.md`
- System: `systems/production.md`
- UI: `modules/ui-components.md`

---

**Last Updated:** 2026-01-02