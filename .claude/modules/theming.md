# Theming System

> **Package**: `@sbozh/themes` at `packages/themes/`
> **Status**: Production (single theme: obsidian-forge)

Controlled theming with CSS variables via Tailwind v4's `@theme` block. Enables per-content theming (e.g., different blog posts can have different "atmospheres").

## Package Structure

```
packages/themes/src/
├── types.ts           # Theme interface, registry (THEMES array)
├── theme-loader.ts    # Load/unload/switch themes, sets data-theme attr
├── theme-context.tsx  # ThemeProvider + useTheme hook
├── index.ts           # Public exports
└── obsidian-forge/
    ├── index.css      # Theme CSS variables
    ├── prose.css      # Typography for MDX content
    ├── code.css       # Syntax highlighting
    └── toc.css        # Table of contents styling
```

## How It Works

Themes define CSS variables inside `@theme {}` blocks (Tailwind v4 syntax). ThemeProvider is **controlled** - parent component passes theme via prop, no internal state or localStorage.

**Key exports:**
- `ThemeProvider` - Controlled provider, requires `theme` prop
- `useTheme()` - Returns `{ theme, themeId }`
- `THEMES` - Array of registered themes
- `DEFAULT_THEME` - Currently `"obsidian-forge"`

## Usage

```tsx
// In layout.tsx - controlled via prop
import { ThemeProvider, DEFAULT_THEME, THEMES } from "@sbozh/themes";
import "@sbozh/themes/obsidian-forge";

const theme = THEMES.find(t => t.id === DEFAULT_THEME);
<ThemeProvider theme={theme} fallback={<Loading />}>
  {children}
</ThemeProvider>

// In components
const { theme, themeId } = useTheme();

// Import shared CSS for MDX content
import "@sbozh/themes/obsidian-forge/prose.css";
import "@sbozh/themes/obsidian-forge/code.css";
```

## Unusual Decisions

- **Controlled over uncontrolled**: No localStorage persistence. Theme is passed as prop, enabling per-content theming where different pages/posts can specify their atmosphere.
- **Shared content CSS**: prose.css, code.css, toc.css moved from blog package to themes. Enables reuse across packages (blog, release-notes, etc.).