# sbozh.me - Personal Startup Website

**Project:** Personal website and portfolio built in public
**Status:** Production
**Primary Goal:** Ship features fast, learn in motion, build in public

---

## Quick Reference

| What | Where | Command |
|------|-------|---------|
| Start Dev | `apps/web` | `pnpm dev` |
| Start All | Root | `pnpm dev` (web + pdf-generator) |
| Test | Root | `pnpm test` |
| Build | Root | `pnpm build` |
| Deploy | Root | `make deploy` |
| Lint | Root | `pnpm lint` |

---

## Architecture Overview

```
Client (Next.js 15)
    ↓
┌───────────────────────────────────┐
│ Main Website (apps/web)           │
│ - Blog (/blog) → Directus CMS     │
│ - Projects (/projects)            │
│ - CV (/cv) → PDF Generator        │
│ - Analytics (Umami)               │
│ - Monitoring (GlitchTip)          │
└───────────────────────────────────┘
    ↓                ↓               ↓
Directus CMS    PDF Service      Analytics
(PostgreSQL)   (Puppeteer)       (Umami)
```

**Core Components:**
- **Web App** (`apps/web`): Next.js 15 app router, React 19, Tailwind CSS v4
- **Blog System** (`packages/blog`): Abstract data layer, Timeline UI, MDX rendering
- **PMDXJS** (`packages/pmdxjs`): Custom markdown parser for CV rendering
- **React UI** (`packages/react-ui`): Shared shadcn/ui components with Obsidian Forge theme
- **PDF Generator** (`services/pdf-generator`): Puppeteer microservice for CV export

---

## Context Documentation Structure

This project uses **fractal documentation** - information organized by attention level:

### Systems (`systems/`)
Hardware, deployment, infrastructure - changes slowly
- `systems/production.md` - Hetzner VPS deployment
- `systems/analytics.md` - Umami analytics
- `systems/cms.md` - Directus CMS infrastructure
- Add more as needed

### Modules (`modules/`)
Core code systems - changes frequently
- `modules/blog.md` - Blog system architecture
- `modules/cv-builder.md` - PMDXJS CV system
- `modules/projects.md` - Projects showcase
- `modules/ui-components.md` - Shared UI library
- Add per major module

### Integrations (`integrations/`)
Cross-system communication
- `integrations/directus.md` - CMS API integration
- `integrations/pdf-service.md` - PDF generation API
- `integrations/analytics.md` - Umami tracking
- Add per integration point

---

## Getting Started (for Claude)

**When you start a session:**
1. Check `ROADMAP.md` for current version goals
2. Check `systems/` for deployment context
3. Check `modules/` for code you're working on
4. Use `integrations/` if touching external systems

**The context router will automatically:**
- Keep recently mentioned files HOT (full content)
- Keep related files WARM (headers only)
- Evict unmentioned files as COLD

---

## Development Workflow

**Daily:**
```bash
pnpm install      # Install dependencies
pnpm dev          # Start dev server (web + pdf-generator)
pnpm test         # Run tests
pnpm lint         # Lint code
```

**Build:**
```bash
pnpm build        # Build all packages
pnpm test:coverage # Test with coverage (required for releases)
```

**Deploy:**
```bash
make deploy           # Deploy web + infrastructure
make deploy-web       # Deploy web only
make deploy-infra     # Deploy infrastructure
make push-web-image   # Build and push Docker image
make swv              # Switch server to current version
```

**Release:**
```bash
make patch    # Bump patch version + update CHANGELOG
make minor    # Bump minor version (requires 90% test coverage)
make major    # Bump major version (requires 90% test coverage)
```

---

## Common Operations

**Run tests:**
```bash
pnpm test                    # All tests
pnpm test:coverage           # With coverage report
pnpm test --filter=@sbozh/blog  # Specific package
```

**Start services:**
```bash
# PDF Generator (for CV export)
cd services/pdf-generator
pnpm dev

# Directus CMS (local)
cd apps/web/directus
docker compose up -d
```

**Add UI components:**
```bash
cd packages/react-ui
pnpm dlx shadcn@latest add button card input
```

---

## Critical Files

| File | Purpose | Notes |
|------|---------|-------|
| `CLAUDE.md` | Project instructions for Claude Code | Always check first |
| `ROADMAP.md` | Version roadmap | Current: 1.3.0 |
| `apps/web/app/page.tsx` | Main page | Motion animations |
| `packages/blog/src/data/repository.ts` | Blog data abstraction | DirectusRepository |
| `packages/pmdxjs/src/parser/index.ts` | CV markdown parser | Core PMDXJS logic |
| `apps/web/lib/site-config.ts` | Site configuration | Social links, email |

---

## Environment Variables

```bash
# Required for production
export DIRECTUS_URL=https://directus.sbozh.me
export DIRECTUS_TOKEN=[token]
export PDF_SERVICE_URL=http://localhost:3010

# Analytics (optional)
export NEXT_PUBLIC_UMAMI_WEBSITE_ID=[id]
export NEXT_PUBLIC_UMAMI_URL=[url]

# Monitoring (optional)
export SENTRY_DSN=[dsn]
```

---

## Dependencies on External Services

| Service | Purpose | Failure Impact | Health Check |
|---------|---------|----------------|--------------|
| Directus CMS | Blog content | Blog pages fail | `curl https://directus.sbozh.me/server/health` |
| PDF Generator | CV export | Download fails, page still works | `curl http://localhost:3010/health` |
| Umami Analytics | Page tracking | No impact, graceful degradation | Optional |
| GlitchTip | Error monitoring | No impact | Optional |

---

## Tech Stack

- **Framework**: Next.js 15 (React 19)
- **Styling**: Tailwind CSS v4
- **Monorepo**: Turborepo
- **CMS**: Directus (PostgreSQL)
- **MDX**: @mdx-js/mdx + rehype plugins
- **UI**: shadcn/ui (customized)
- **Testing**: Vitest
- **PDF**: Puppeteer microservice
- **Deployment**: Docker, Nginx, Hetzner

---

## Design System: Obsidian Forge

A dark, spacious aesthetic with deliberate motion.

**Colors:**
- Background: Deep obsidian (#0a0a0f)
- Primary: Amethyst (#8b5cf6)
- Secondary: Gold (#f59e0b)
- Accent: Terminal green (#22c55e)

**Typography:**
- Headings: Space Grotesk
- Code: JetBrains Mono

**SparkMark:** The `*` symbol with purple-to-gold gradient

---

## Recent Changes

**2026-01-02:**
- Implemented Claude Cognitive for persistent context
- Fixed CV pagination (removed blank second page)
- Added X.com social link to footer
- Fixed blog sitemap to use date_published instead of date_updated
- Fixed double animation on main page load

**2025-12-XX:**
- Released v1.2.0 with 404 page animations
- Added blog post table of contents border on mobile

---

## Current Focus

**Version 1.3.0 - Release Notes & Main Page**
- Projects collection in Directus
- Release Notes collection in Directus
- Projects Changelog and Roadmap redesign into release notes
- Release notes on Main page
- Last blog post on main page
- "What is this" button

See `ROADMAP.md` for full roadmap through v1.7.0 (Subscriptions).

---

## For New Developers

**This file helps Claude Code:**
1. Understand project structure
2. Avoid hallucinating non-existent integrations
3. Maintain context across long sessions
4. Coordinate across multiple concurrent instances

**Project conventions:**
- Commit strategy: Use `/commit` for conventional commits with changelog
- Release workflow: `make patch|minor|major` with automated versioning
- UI components: Always use shadcn/ui from `@sbozh/react-ui`
- Testing: Add tests for new functionality in apps/

---

## Multi-Instance Coordination

If you're running multiple Claude Code instances on this project:

1. **Set instance ID:**
   ```bash
   export CLAUDE_INSTANCE=A  # Or B, C, D, etc.
   ```

2. **Signal when completing work:**
   ```pool
   INSTANCE: A
   ACTION: completed
   TOPIC: [Brief description]
   SUMMARY: [What changed]
   AFFECTS: [Files/systems touched]
   BLOCKS: [What this unblocks]
   ```

3. **Other instances will see your updates** at their next session start

4. **Typical multi-instance workflow:**
   - Instance A: Working on 1.3.0 Release Notes feature
   - Instance B: Fixing bugs or smaller tasks
   - Pool coordinator prevents conflicts automatically

---

**Last Updated:** 2026-01-02
**Maintained By:** Sem Bozhyk (@sbozh)