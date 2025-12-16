# @sbozh/website

Personal website and portfolio for sbozh.me. Built in public, learned in motion.

**Version**: 0.11.9 | **Status**: Production | **License**: MIT

## Live

- **Website**: [sbozh.me](https://sbozh.me)
- **Analytics**: [analytics.sbozh.me](https://analytics.sbozh.me) (Umami)
- **CMS**: [cms.sbozh.me](https://cms.sbozh.me) (Directus)

## Features

### Deployment (v0.11.x)
- **Hetzner VPS**: Production deployment with Docker Compose
- **CI/CD**: GitHub Actions with automatic image builds
- **SSL**: Let's Encrypt with Nginx reverse proxy
- **Analytics**: Self-hosted Umami for privacy-first tracking
- **Backups**: Automated PostgreSQL dumps and data archival

### Legal & Privacy (v0.10.x)
- **Cookie Consent**: GDPR-compliant consent modal
- **Privacy Policy**: Full privacy controls page
- **Terms of Service**: Legal terms page

### Analytics (v0.9.x)
- **Umami**: Self-hosted, privacy-first page analytics
- **Web Vitals**: Core Web Vitals tracking
- **Custom Events**: Blog reads, CV downloads, navigation

### Projects Section (v0.8.x)
- **Project Showcase**: Grid layout with status badges and hero images
- **Project Details**: Tabbed navigation for About, Motivation, Roadmap, Changelog
- **Accessibility**: ARIA labels, keyboard navigation, focus management

### SEO (v0.7.x)
- **OpenGraph**: Dynamic OG images for blog posts
- **Sitemap**: Auto-generated XML sitemap
- **Robots**: Configurable robots.txt

### Blog System (v0.6.x)
- **Directus CMS**: Headless CMS with PostgreSQL backend
- **Multi-persona**: Different writing styles with persona indicators
- **MDX Rendering**: Rich content with syntax highlighting

### CV Page (v0.4.x)
- **Custom Parser**: PMDXJS for markdown-to-JSX conversion
- **PDF Export**: Server-side generation with Puppeteer microservice
- **Print Support**: A4/Letter layouts with proper pagination

## Design

**Obsidian Forge** — A dark, spacious aesthetic

- **Colors**: Deep obsidian background (#0a0a0f), amethyst primary (#8b5cf6), gold secondary (#f59e0b), terminal green accent (#22c55e)
- **Typography**: Space Grotesk (headings), JetBrains Mono (code)
- **Motion**: Deliberate animations with smooth easing, staggered page reveals
- **SparkMark**: The `*` symbol — purple-to-gold gradient, appears in tagline and favicon

## Tech Stack

- **Framework**: Next.js 15 (React 19)
- **Build**: Turborepo + pnpm
- **UI**: shadcn/ui + Tailwind CSS v4
- **Animation**: Framer Motion
- **Testing**: Vitest (90%+ coverage)
- **CMS**: Directus
- **Analytics**: Umami
- **PDF**: Puppeteer microservice
- **Deployment**: Docker, Nginx, Hetzner

## Structure

```
apps/
  web/                  # Main website (Next.js)
    app/                # App router pages and API routes
    components/         # React components
    lib/                # Utilities and data
    directus/           # CMS configuration and schemas
services/
  pdf-generator/        # PDF generation microservice (Puppeteer)
packages/
  blog/                 # Blog components and data layer
  pmdxjs/               # PMDXJS - Markdown to JSX parser for CVs
  react-ui/             # Shared UI components (shadcn/ui)
  eslint-config/        # Shared ESLint config
  typescript-config/    # Shared TypeScript config
deploy/
  production/           # Production deployment configs
    docker-compose.prod.yaml
    nginx.conf.template
    scripts/            # Deployment and backup scripts
```

## Packages

### @sbozh/blog

Blog UI package with abstract data layer (repository pattern):
- Timeline components with year/month grouping
- Filter components for date, tags, and persona
- MDX rendering with syntax highlighting
- Repository pattern for backend flexibility

### @sbozh/pmdxjs

Custom markdown parser for CV rendering:
- Extended syntax for CV elements (entries, tags, columns)
- Inline formatting with branded `{*}` spark marker
- A4/Letter page layouts with print support

### @sbozh/react-ui

Shared UI components built on shadcn/ui with Obsidian Forge theming.

### @sbozh/pdf-generator

Puppeteer-based PDF generation microservice:
- Fastify HTTP server
- Headless Chrome rendering
- Health check endpoint

## Development

```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev server (web + pdf-generator)
pnpm build            # Build all packages
pnpm lint             # Lint all packages
pnpm test             # Run tests
pnpm test:coverage    # Run tests with coverage
```

### Start PDF Service (for CV export)

```bash
cd services/pdf-generator
pnpm dev
```

### Start Directus CMS

```bash
cd apps/web/directus
docker compose up -d
```

## Deployment

```bash
make deploy           # Deploy web + infrastructure
make deploy-web       # Deploy web only
make deploy-infra     # Deploy infrastructure only
make push-web-image   # Build and push Docker image
make swv              # Switch server to current version
```

## Release

```bash
make patch            # Bump patch version + update CHANGELOG
make minor            # Bump minor version (requires 90% test coverage)
make major            # Bump major version (requires 90% test coverage)
```

## Adding UI Components

```bash
cd packages/react-ui
pnpm dlx shadcn@latest add button card input
```
