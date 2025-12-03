# @sbozh/website

Monorepo for sbozh.me website.

## Tech Stack

- **Framework**: Next.js 15 (React 19)
- **Build**: Turborepo + pnpm
- **UI**: shadcn/ui + Tailwind CSS v4
- **Testing**: Vitest
- **Linting**: ESLint 9 + Prettier

## Structure

```
apps/
  web/                # Main website (Next.js)
packages/
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
