# @sbozh/website

Personal website and portfolio for sbozh.me. Built in public, learned in motion.

**Version**: 0.8.5 | **Status**: Beta | **License**: MIT

## Features

### Projects Section (v0.8.x)
- **Project Showcase**: Grid layout with status badges and hero images
- **Project Details**: Tabbed navigation for About, Motivation, Roadmap, Changelog
- **Discord Community**: Full project page with roadmap tracking
- **Accessibility**: ARIA labels, keyboard navigation, focus management
- **Testing**: Comprehensive unit and integration tests (41+ tests)

### Blog System (v0.6.x)
- **Directus CMS**: Headless CMS with PostgreSQL backend
- **Multi-persona**: Different writing styles with persona indicators
- **MDX Rendering**: Rich content with syntax highlighting
- **SEO Optimized**: OpenGraph tags, sitemaps, structured data

### CV Page (v0.4.x)
- **Custom Parser**: PMDXJS for markdown-to-JSX conversion
- **PDF Export**: Server-side generation with Puppeteer
- **Print Support**: A4/Letter layouts with proper pagination

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
- `/projects` - Projects showcase with card grid layout
- `/projects/[slug]` - Project detail pages with tabbed navigation
- `/projects/discord-community` - Discord community project page
- `/contact` - Contact page with email and social links

## Structure

```
apps/
  web/                  # Main website (Next.js)
    app/                # App router pages and API routes
    components/         # React components
    lib/                # Utilities and data
    directus/           # CMS configuration and schemas
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
