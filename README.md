# @sbozh/website

Personal website and portfolio for sbozh.me.

## Design

**Obsidian Forge** — A dark, spacious aesthetic

- **Colors**: Deep obsidian background (#0a0a0f), amethyst primary (#8b5cf6), gold secondary (#f59e0b), terminal green accent (#22c55e)
- **Typography**: Space Grotesk (headings), JetBrains Mono (code)
- **Motion**: Deliberate animations with smooth easing, staggered page reveals, sliding underlines
- **SparkMark**: The `*` symbol — purple-to-gold gradient, appears only in tagline and favicon

## Tech Stack

- **Framework**: Next.js 15.5.7 (React 19.2.1)
- **Build**: Turborepo + pnpm
- **UI**: shadcn/ui + Tailwind CSS v4
- **Animation**: Framer Motion
- **Testing**: Vitest (90%+ coverage)
- **Linting**: ESLint 9 + Prettier

## Pages

- `/` - Homepage with navigation
- `/blog` - Blog with multi-persona timeline, filters, and MDX rendering
- `/blog/[slug]` - Blog post pages with table of contents
- `/cv` - CV/Resume with PDF export
- `/projects` - Projects showcase (coming soon)

## Structure

```
apps/
  web/                  # Main website (Next.js)
packages/
  blog/                 # Blog components and data layer
  pmdxjs/               # PMDXJS - Markdown to JSX parser for CVs
  react-ui/             # Shared UI components (shadcn/ui)
  eslint-config/        # Shared ESLint config
  typescript-config/    # Shared TypeScript config
```

## Packages

### @sbozh/blog

Blog UI package with abstract data layer (repository pattern):
- **Timeline components** - Year/month grouped post cards with persona indicators
- **Filter components** - Dropdowns for date, tags, and persona filtering
- **Post components** - MDX rendering with syntax highlighting and table of contents
- **Repository pattern** - Abstract interface for easy backend swapping (currently uses mock data)
- **SEO ready** - OpenGraph tags, static generation, optimized metadata

### @sbozh/pmdxjs

Custom markdown parser for CV rendering with:
- Extended syntax for CV elements (entries, tags, columns)
- Inline formatting with branded `{*}` spark marker
- A4/Letter page layouts with print support
- PDF export via Puppeteer

### @sbozh/react-ui

Shared UI components built on shadcn/ui with Obsidian Forge theming.

## Development

```bash
pnpm install    # Install dependencies
pnpm dev        # Start dev server
pnpm build      # Build all packages
pnpm lint       # Lint all packages
pnpm test       # Run tests
```

## Adding UI Components

```bash
cd packages/react-ui
pnpm dlx shadcn@latest add button card input
```

## Release

```bash
make patch      # Bump patch version + update CHANGELOG
make minor      # Bump minor version (requires 90% test coverage)
make major      # Bump major version (requires 90% test coverage)
```
