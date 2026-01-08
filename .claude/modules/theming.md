# Theming System

> **Package**: `@sbozh/themes` at `packages/themes/`
> **Status**: Production (two themes: obsidian-forge, kognitiv)

Controlled theming with CSS variables via Tailwind v4's `@theme` block. Enables per-content theming (e.g., different blog posts can have different "atmospheres").

## Package Structure

```
packages/themes/src/
├── types.ts              # Theme interface, registry (THEMES array)
├── theme-loader.ts       # Load/unload/switch themes, sets data-theme attr
├── theme-context.tsx     # ThemeProvider, useTheme, PageTheme
├── theme-loader-overlay.tsx  # Blocking loader for font loading
├── index.ts              # Public exports
├── obsidian-forge/       # Default theme
│   ├── index.css
│   ├── prose.css
│   ├── code.css
│   └── toc.css
└── kognitiv/             # Techno-thriller theme
    ├── index.css
    ├── typography.css
    ├── prose.css
    ├── code.css
    └── toc.css
```

## How It Works

Themes define CSS variables scoped to `[data-theme="theme-id"]` selectors. ThemeProvider is **controlled** - parent component passes theme via prop, no internal state or localStorage.

**Key exports:**
- `ThemeProvider` - Controlled provider, requires `theme` prop
- `useTheme()` - Returns `{ theme, themeId }`
- `PageTheme` - Client component to override page theme
- `ThemeLoaderOverlay` - Blocking loader while fonts load
- `THEMES` - Array of registered themes
- `DEFAULT_THEME` - Currently `"obsidian-forge"`

## Available Themes

### obsidian-forge (default)
Dark, spacious aesthetic with amethyst and gold accents. Space Grotesk + JetBrains Mono fonts.

### kognitiv
Techno-thriller reading experience for Leon Chamai stories. Cold War command center aesthetic with IBM Plex Sans/Mono fonts. Uses Google Fonts `@import` (fonts only download when theme is active).

## Per-Article Theming

Blog posts can specify a theme via the `theme` field in Directus. The theme is applied client-side using `PageTheme`.

```tsx
// In blog/[slug]/page.tsx
{post.theme && <PageTheme theme={post.theme} />}
{post.theme && post.theme !== DEFAULT_THEME && (
  <ThemeLoaderOverlay spinner={<Image src="/android-chrome-192x192.png" ... />} />
)}
```

**How it works:**
1. `PageTheme` sets `data-theme` on `document.documentElement` via `useLayoutEffect`
2. On unmount, resets to `DEFAULT_THEME`
3. `ThemeLoaderOverlay` blocks until `document.fonts.ready` resolves, then fades out

## ThemeLoaderOverlay

Prevents flash of unstyled content when loading themes with custom fonts.

```tsx
<ThemeLoaderOverlay spinner={<YourSpinner />} />
```

- Full-page black overlay (`#0d1117`)
- Waits for `document.fonts.ready`
- Fades out in 300ms when fonts loaded
- Only use for non-default themes (default fonts are already loaded)

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
- **Client-side PageTheme**: SSR theme on wrapper divs doesn't work (only affects descendants). PageTheme uses client-side `useLayoutEffect` to set theme on `<html>`.
- **Conditional font loading**: KOGNITIV uses Google Fonts `@import` in its CSS. Fonts only download when the theme's CSS variables (including `font-family`) are applied.