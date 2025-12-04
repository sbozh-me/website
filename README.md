# @sbozh/website

Personal website and portfolio for sbozh.me.

## Design

**Obsidian Forge** — A dark, spacious aesthetic

- **Colors**: Deep obsidian background (#0a0a0f), amethyst primary (#8b5cf6), gold secondary (#f59e0b), terminal green accent (#22c55e)
- **Typography**: Space Grotesk (headings), JetBrains Mono (code)
- **Motion**: Deliberate animations with smooth easing, staggered page reveals, sliding underlines
- **SparkMark**: The `*` symbol — purple-to-gold gradient, appears only in tagline and favicon

## Tech Stack

- **Framework**: Next.js 15 (React 19)
- **Build**: Turborepo + pnpm
- **UI**: shadcn/ui + Tailwind CSS v4
- **Animation**: Framer Motion
- **Testing**: Vitest (100% coverage)
- **Linting**: ESLint 9 + Prettier

## Pages

- `/` - Homepage with navigation
- `/blog` - Blog (coming soon)
- `/cv` - CV/Resume (coming soon)
- `/projects` - Projects showcase (coming soon)

## Structure

```
apps/
  web/                # Main website (Next.js)
packages/
  pmdxjs/             # PMDXJS - Markdown to JSX parser for CVs
  react-ui/           # Shared UI components (shadcn/ui)
  eslint-config/      # Shared ESLint config
  typescript-config/  # Shared TypeScript config
```

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
