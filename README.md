# @sbozh/website

Monorepo for sbozh.me website.

## Tech Stack

- **Framework**: Next.js 15 (React 19)
- **Build**: Turborepo + pnpm
- **Testing**: Vitest
- **Linting**: ESLint 9 + Prettier

## Structure

```
apps/
  web/          # Main website (Next.js)
packages/
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

## Release

```bash
make patch      # Bump patch version + update CHANGELOG
make minor      # Bump minor version (requires 90% test coverage)
make major      # Bump major version (requires 90% test coverage)
```
