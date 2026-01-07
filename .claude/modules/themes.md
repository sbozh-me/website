# Themes Package

> **Location**: `packages/themes/src/`
> **Status**: Production

Self-contained theme system with CSS variables. Each theme is a complete folder.

## Adding a New Theme - Checklist

1. **Create folder**: `src/{theme-id}/` (e.g., `src/arctic-light/`)
2. **Copy structure** from `obsidian-forge/` as template
3. **Customize all CSS files** - do not share CSS between themes
4. **Register in types.ts**: Add to `THEMES` array
5. **Add export to package.json**: `"./{theme-id}": "./src/{theme-id}/index.css"`

## Required File Structure

```
src/{theme-id}/
├── index.css        # Entry point, @imports all others
├── typography.css   # Prose, code, syntax, toc variables
├── prose.css        # Article typography styles
├── code.css         # Code block and syntax highlighting
└── toc.css          # Table of contents styles
```

## File Responsibilities

| File | Contains |
|------|----------|
| `index.css` | Colors, radius, toast, fonts + `@import "./typography.css"` |
| `typography.css` | All `--prose-*`, `--code-*`, `--syntax-*`, `--toc-*` variables |
| `prose.css` | `.prose` class styles using variables |
| `code.css` | Code blocks, syntax token colors |
| `toc.css` | `.toc` class styles |

## Registration

**types.ts** - Theme ID must match folder name exactly:
```typescript
export const THEMES: Theme[] = [
  { id: "obsidian-forge", name: "Obsidian Forge", description: "..." },
  { id: "arctic-light", name: "Arctic Light", description: "..." }, // new
];
```

**package.json** - Single export per theme:
```json
"exports": {
  "./obsidian-forge": "./src/obsidian-forge/index.css",
  "./arctic-light": "./src/arctic-light/index.css"
}
```

## Usage

```tsx
// Single import gets everything
import "@sbozh/themes/obsidian-forge";
```

## Why Small Files?

Files are split for developer/AI ergonomics - smaller context windows when editing specific styles. Technically everything merges via `@import` in index.css.

## Gotchas

- **ID must match folder**: `id: "arctic-light"` requires folder `arctic-light/`
- **No shared CSS**: Each theme is fully self-contained, copy all files
- **Single import only**: Individual file exports (prose, code, toc) are dead code
- **@theme block**: Variables must be inside `@theme { }` for Tailwind v4