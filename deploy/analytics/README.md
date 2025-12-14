# Analytics & Error Tracking Setup

This directory contains the Docker-based infrastructure for self-hosted analytics (Umami) and error tracking (GlitchTip) services.

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ and pnpm (for Next.js integration)
- 2GB available RAM minimum
- Ports 3001 and 3002 available

### 1. Initial Setup

```bash
# Clone and navigate to analytics directory
cd deploy/analytics

# Copy environment template
cp .env.example .env

# Generate secure secrets
# For UMAMI_APP_SECRET (32 chars):
openssl rand -hex 16

# For GLITCHTIP_SECRET_KEY (50 chars):
openssl rand -base64 38 | head -c 50

# Edit .env with your generated secrets
nano .env
```

### 2. Start Services

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 3. Configure Umami

1. Access Umami: http://localhost:3001
2. Login: admin/umami (change immediately!)
3. Add website:
   - Settings → Websites → Add website
   - Name: sbozh.me Development
   - Domain: localhost
4. Copy website ID to your `.env.local`

### 4. Configure GlitchTip

1. Access GlitchTip: http://localhost:3002
2. Create admin account (first user)
3. Create organization and project
4. Get DSN from project settings
5. Add DSN to your `.env.local`

### 5. Next.js Integration

```bash
# Install dependencies in your Next.js app
cd ../../apps/web
pnpm add @sentry/nextjs web-vitals

# Add to .env.local
NEXT_PUBLIC_ANALYTICS_ENABLED=true
NEXT_PUBLIC_UMAMI_WEBSITE_ID=your-website-id
NEXT_PUBLIC_UMAMI_SCRIPT_URL=http://localhost:3001/script.js
NEXT_PUBLIC_GLITCHTIP_DSN=http://your-key@localhost:3002/1
```

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│  Next.js    │────▶│    Umami     │────▶│  PostgreSQL   │
│  Application│     │  (Port 3001) │     │  (Shared DB)  │
└─────────────┘     └──────────────┘     └───────────────┘
       │                                           ▲
       │            ┌──────────────┐              │
       └───────────▶│  GlitchTip   │──────────────┘
                    │  (Port 3002) │
                    └──────────────┘
                           │
                    ┌──────────────┐
                    │    Redis     │
                    │   (Cache)    │
                    └──────────────┘
```

## Services

### Umami (Analytics)
- **URL**: http://localhost:3001
- **Purpose**: Privacy-focused web analytics
- **Features**: Page views, events, no cookies, GDPR compliant
- **Default login**: admin/umami

### GlitchTip (Error Tracking)
- **URL**: http://localhost:3002
- **Purpose**: Error and performance monitoring
- **Features**: Sentry-compatible, error grouping, alerts
- **Setup**: Create account on first visit

### PostgreSQL
- **Purpose**: Shared database for both services
- **Databases**: umami_db, glitchtip_db
- **Access**: Via container network only

### Redis
- **Purpose**: Cache and queue for GlitchTip
- **Persistence**: AOF enabled

## Common Operations

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f umami
docker-compose logs -f glitchtip-web
```

### Restart Services
```bash
# All services
docker-compose restart

# Specific service
docker-compose restart umami
```

### Stop Services
```bash
docker-compose down

# Remove volumes (WARNING: deletes all data)
docker-compose down -v
```

### Backup Database
```bash
# Backup all databases
docker exec analytics-postgres pg_dumpall -U analytics_admin > backup_$(date +%Y%m%d).sql

# Backup specific database
docker exec analytics-postgres pg_dump -U analytics_admin umami_db > umami_backup.sql
docker exec analytics-postgres pg_dump -U analytics_admin glitchtip_db > glitchtip_backup.sql
```

### Restore Database
```bash
# Restore from backup
docker exec -i analytics-postgres psql -U analytics_admin < backup.sql
```

### Update Services
```bash
# Pull latest images
docker-compose pull

# Recreate containers
docker-compose up -d
```

## Troubleshooting

### Services Won't Start

```bash
# Check logs for errors
docker-compose logs postgres
docker-compose logs umami

# Common issues:
# - Port conflicts: Change ports in docker-compose.yml
# - Database issues: Remove volumes and restart
docker-compose down -v
docker-compose up -d
```

### No Data in Dashboards

1. Check browser console for errors
2. Verify environment variables in Next.js
3. Check Content Security Policy headers
4. Ensure tracking script is loaded

### High Memory Usage

```bash
# Check current usage
docker stats

# Adjust limits in .env
UMAMI_MEMORY=256M
GLITCHTIP_MEMORY=256M
```

### Database Connection Issues

```bash
# Test database connection
docker exec analytics-postgres psql -U analytics_admin -d umami_db -c "SELECT 1"

# Reset database passwords
# Edit .env, then:
docker-compose down
docker-compose up -d
```

## Security

### Production Checklist

- [ ] Change all default passwords
- [ ] Generate strong secrets
- [ ] Configure SSL/TLS (use reverse proxy)
- [ ] Limit database access
- [ ] Set up regular backups
- [ ] Configure firewall rules
- [ ] Enable audit logging
- [ ] Set up monitoring alerts

### Secrets Management

Never commit `.env` files. Use environment-specific configs:
- `.env.local` - Local development
- `.env.production` - Production (store securely)

## Resource Requirements

### Minimum (Development)
- RAM: 2GB
- CPU: 2 cores
- Disk: 5GB

### Recommended (Production)
- RAM: 4GB
- CPU: 4 cores
- Disk: 20GB+
- Regular backups

## Monitoring

### Health Checks

Services include built-in health checks:
```bash
# Check service health
docker-compose ps

# Manual health check
curl -I http://localhost:3001/api/heartbeat
curl -I http://localhost:3002/api/health
```

### Metrics to Monitor

- **Umami**: Page views, unique visitors, bounce rate
- **GlitchTip**: Error rate, response time, issue count
- **System**: CPU, memory, disk usage

## Support

For issues or questions:
1. Check logs: `docker-compose logs`
2. Review documentation in `/roadmap/analytics/`
3. File issues at: https://github.com/sbozh-me/website/issues

## License

This infrastructure setup is part of the sbozh.me website project.