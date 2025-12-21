# Local Services

Local development setup for self-hosted services that support the sbozh.me project.

These are **not** part of the main application - they are standalone services that would typically run on separate infrastructure in production.

## Services

| Service | Directory | Port | Purpose |
|---------|-----------|------|---------|
| [Directus](https://directus.io/) | `directus/` | 8055 | Headless CMS for content management |
| [Umami](https://umami.is/) | `analytics/` | 3001 | Privacy-focused web analytics |
| [GlitchTip](https://glitchtip.com/) | `monitoring/` | 3002 | Error tracking (Sentry-compatible) |

## Quick Start

Each service has its own setup. Navigate to the service directory and follow the README:

```bash
# Directus (required for development)
cd directus && cat README.md

# Umami (optional - analytics)
cd analytics && cat README.md

# GlitchTip (optional - error tracking)
cd monitoring && cat README.md
```

## Architecture

```
sbozh.me (Next.js app)
    │
    ├──> Directus (port 8055)     # Content API
    │       └── PostgreSQL
    │
    ├──> Umami (port 3001)        # Analytics
    │       └── PostgreSQL
    │
    └──> GlitchTip (port 3002)    # Error tracking
            ├── PostgreSQL
            └── Redis
```

## Production

In production, these services run on separate infrastructure:
- See `deploy/production/` for production deployment configs
