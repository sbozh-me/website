# GlitchTip Error Tracking

Self-hosted error tracking for the sbozh.me website using [GlitchTip](https://glitchtip.com/).

## Prerequisites

- Docker and Docker Compose
- ~1GB RAM available
- Port 3002 available

## Quick Start

```bash
# 1. Setup environment
make setup

# 2. Update .env with generated secrets from .env.generated

# 3. Start services
make up

# 4. Access GlitchTip
open http://localhost:3002
```

## Architecture

```
Next.js App
    │
    └──> GlitchTip Web (port 3002)
            ├──> PostgreSQL (database)
            ├──> Redis (cache/queue)
            └──> Worker (background tasks)
```

## Services

| Service | Container | Purpose |
|---------|-----------|---------|
| PostgreSQL | sbozh-glitchtip-db | Database storage |
| Redis | sbozh-glitchtip-redis | Cache and task queue |
| GlitchTip Web | sbozh-glitchtip-web | Web interface and API |
| GlitchTip Worker | sbozh-glitchtip-worker | Background task processing |

## Common Operations

```bash
make up        # Start all services
make down      # Stop all services
make restart   # Restart all services
make logs      # View all logs
make status    # Check service status
make health    # Quick health check
make backup    # Backup database
```

## Initial Setup

1. Start services with `make up`
2. Navigate to http://localhost:3002
3. Create your admin account (first user)
4. Create an organization
5. Create a project (select "Next.js" as platform)
6. Copy the DSN from Project Settings -> Client Keys (DSN)

## Next.js Integration

### 1. Install Sentry SDK

```bash
pnpm add @sentry/nextjs
```

### 2. Run Sentry Wizard

```bash
npx @sentry/wizard@latest -i nextjs
```

### 3. Configure DSN

Add to `.env.local`:

```env
NEXT_PUBLIC_GLITCHTIP_DSN=http://your-key@localhost:3002/1
SENTRY_DSN=http://your-key@localhost:3002/1
```

### 4. Update sentry.client.config.ts

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_GLITCHTIP_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
```

## Troubleshooting

### Services not starting

```bash
# Check logs
make logs

# Restart services
make restart
```

### Database connection issues

```bash
# Check PostgreSQL health
docker exec sbozh-glitchtip-db pg_isready -U glitchtip -d glitchtip
```

### Worker not processing events

```bash
# Check worker logs
make logs-worker

# Restart worker
docker-compose restart worker
```

## Backup & Restore

```bash
# Create backup
make backup

# Restore from backup
make restore BACKUP_FILE=backups/glitchtip_20250101_120000.sql
```

## Resource Requirements

| Service | Memory | CPU |
|---------|--------|-----|
| PostgreSQL | ~100MB | Low |
| Redis | ~50MB | Low |
| GlitchTip Web | ~300MB | Low |
| GlitchTip Worker | ~200MB | Low |
| **Total** | **~650MB** | |

## Security Checklist

- [ ] Change default secrets in `.env`
- [ ] Disable open registration in production
- [ ] Use HTTPS in production (update GLITCHTIP_DOMAIN)
- [ ] Configure email alerts for critical errors
- [ ] Set up regular backups

## Resources

- [GlitchTip Documentation](https://glitchtip.com/documentation)
- [GlitchTip Docker Install](https://glitchtip.com/documentation/install)
- [Sentry SDK for Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
