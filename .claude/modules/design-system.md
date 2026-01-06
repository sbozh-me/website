# Obsidian Forge Design System

> **Location**: `apps/web/app/globals.css`
> **Status**: Production (since v0.3.0)

Dark, spacious aesthetic with deliberate motion. Named after obsidian stone + metalworking craft. Optimized for long-form reading (blog is primary content).

## Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-background` | `#0a0a0f` | Deep obsidian base |
| `--color-foreground` | `#e5e7eb` | Primary text (high contrast for readability) |
| `--color-muted` | `#18181b` | Cards, code blocks |
| `--color-muted-foreground` | `#6b7280` | Secondary text, metadata |
| `--color-primary` | `#8b5cf6` | Amethyst - links, active states |
| `--color-secondary` | `#f59e0b` | Gold - numbers, highlights |
| `--color-accent` | `#22c55e` | Terminal green - success, strings |
| `--color-border` | `#27272a` | Subtle dividers |
| `--color-ring` | `#f59e0b` | Focus rings (gold) |

## Typography (Reading-First)

- **Headings**: Space Grotesk (`--font-sans`)
- **Code**: JetBrains Mono (`--font-mono`)
- **Base size**: 18px (larger for comfortable reading)
- **Line-height**: 1.7-1.8 (generous for prose)
- **Prose max-width**: 65ch (optimal reading line length)
- **Paragraph spacing**: 1.5rem bottom margin

## SparkMark Component

> **Location**: `apps/web/components/Spark.tsx`

The `*` symbol with purple-over-gold overlay creating a gradient effect:
- Purple half overlays gold base
- Used as decorative marker in headings
- Cursor shows `help` for easter egg hint

## Motion Patterns

Framer Motion (`framer-motion@12.x`) powers animations:

**Page load (staggered fade-up)**:
```ts
container = { hidden: { opacity: 0 }, show: { transition: { staggerChildren: 0.1 } } }
item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, duration: 0.3 } }
```

**Nav underline**:
- `after:` pseudo-element, `w-0` to `w-full` on hover
- Duration: 200ms, ease-out

**Icon lift**:
- `hover:-translate-y-0.5` on social icons
- Duration: 200ms, ease-out

**Reduced motion**: All animations collapse to 0.01ms via `prefers-reduced-motion` media query.

## Code Syntax Theme

> **Location**: `packages/blog/src/components/post/code.css`

| Token | Color |
|-------|-------|
| Keywords | Amethyst (`#8b5cf6`) |
| Strings | Terminal green (`#22c55e`) |
| Numbers/constants | Gold (`#f59e0b`) |
| Comments | Muted (`#6b7280`) |

## Toast Theming

Tinted backgrounds with colored borders:
- Success: Green-tinted bg (`#0f1a14`), green border
- Error: Red-tinted bg (`#1c1012`), red border
- Warning: Gold-tinted bg (`#1a1608`), gold border
- Info: Purple-tinted bg (`#0f0f1a`), purple border

## Key Decisions

- **Reading-first**: 18px base, 65ch width, 1.7+ line-height prioritize long-form content
- **No light mode for site**: CV has print-only light mode
- **Selection color**: Purple at 40% opacity
- **Focus rings**: 1px purple outline (not default blue)
- **Transitions**: Consistent 200ms duration with ease-out
- **Subtle animations**: Motion enhances without distracting from reading