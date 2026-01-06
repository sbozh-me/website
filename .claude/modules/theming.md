# Theming System

> **Package**: `@sbozh/themes` at `packages/themes/`
> **Status**: Production (single theme: obsidian-forge)

Multi-theme infrastructure with CSS variables via Tailwind v4's `@theme` block.

## Package Structure

```
packages/themes/src/
├── types.ts           # Theme interface, registry (THEMES array)
├── theme-loader.ts    # Load/unload/switch themes, sets data-theme attr
├── theme-context.tsx  # ThemeProvider + useTheme hook
├── index.ts           # Public exports
└── obsidian-forge/
    └── index.css      # Obsidian Forge CSS variables
```

## How It Works

Themes define CSS variables inside `@theme {}` blocks (Tailwind v4 syntax). The theme loader sets `data-theme` on `<html>`, and theme CSS is imported statically.

**Key exports:**
- `ThemeProvider` - Wrap app, handles localStorage persistence
- `useTheme()` - Returns `{ theme, themeId, setTheme, availableThemes }`
- `THEMES` - Array of registered themes
- `DEFAULT_THEME` - Currently `"obsidian-forge"`

## Usage

```tsx
// In layout.tsx
import { ThemeProvider } from "@sbozh/themes";
import "@sbozh/themes/obsidian-forge";

<ThemeProvider>{children}</ThemeProvider>

// In components
const { theme, setTheme, availableThemes } = useTheme();
```

## Adding New Themes

1. Create `src/[theme-name]/index.css` with `@theme {}` block
2. Add to `THEMES` array in `types.ts`
3. Export CSS path from package.json if needed
4. Import theme CSS where used

## Unusual Decisions

- **Static imports over dynamic loading**: Bundler handles CSS, `loadTheme()` just sets `data-theme` attribute. Simpler than runtime CSS injection.
- **localStorage key**: `sbozh-theme` - persists user preference across sessions.