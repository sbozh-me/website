# Umami Analytics

Local development setup for [Umami](https://umami.is/) - privacy-focused web analytics.

## Prerequisites

- Docker and Docker Compose
- ~300MB RAM available
- Port 3001 available

## Quick Start

```bash
make setup    # Creates .env from template + generates secrets
# Edit .env with generated secrets from .env.generated
make up       # Start Umami on http://localhost:3001
```

## Services

| Service | Container | Port |
|---------|-----------|------|
| Umami | sbozh-umami | 3001 |
| PostgreSQL | sbozh-umami-db | 5432 (internal) |

## Common Commands

```bash
make up        # Start services
make down      # Stop services
make restart   # Restart services
make logs      # View all logs
make status    # Check health
make backup    # Backup database
```

## Initial Setup

1. Start services with `make up`
2. Open http://localhost:3001
3. Login with `admin` / `umami`
4. **Change password immediately**
5. Add website: Settings → Websites → Add website
6. Copy the Website ID to your app's `.env.local`

## Next.js Integration

Add to `.env.local`:

```env
NEXT_PUBLIC_UMAMI_WEBSITE_ID=<your-website-id>
NEXT_PUBLIC_UMAMI_SCRIPT_URL=http://localhost:3001/script.js
```

## Resources

- [Umami Documentation](https://umami.is/docs)
- [Umami GitHub](https://github.com/umami-software/umami)
