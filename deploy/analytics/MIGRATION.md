# Migration Guide: 0.9.x to 0.10.0 (Production Deployment)

This guide covers migrating the analytics infrastructure from local development to production deployment.

## Overview

Version 0.10.0 focuses on production deployment to a VPS with:
- SSL/TLS encryption
- Proper security hardening
- Monitoring and alerting
- Backup automation
- High availability considerations

## Pre-Migration Checklist

Before migrating, ensure all 0.9.x features work correctly:

- [ ] Analytics tracking working locally
- [ ] Privacy controls functional
- [ ] Consent management working
- [ ] Performance metrics collecting
- [ ] Error tracking operational (GlitchTip)
- [ ] Data retention policies configured
- [ ] All unit tests passing
- [ ] Documentation reviewed and updated

### Verify Local Setup

```bash
# Run all tests
pnpm --filter @sbozh/web test run

# Check analytics services
cd deploy/analytics
docker-compose ps

# Verify tracking is working
# Visit localhost:3000 and check Umami dashboard
```

## Migration Steps

### Phase 1: Prepare Production Server

#### 1.1 Server Requirements

Minimum specifications:
- **CPU**: 2 cores
- **RAM**: 4GB (8GB recommended)
- **Disk**: 40GB SSD
- **OS**: Ubuntu 22.04 LTS or Debian 12

#### 1.2 Initial Server Setup

```bash
# SSH to your server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install required packages
apt install -y curl git ufw fail2ban

# Create deployment user
adduser deploy
usermod -aG sudo deploy

# Set up SSH keys for deploy user
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# Disable root SSH login (after confirming deploy user works)
# sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
# systemctl restart sshd
```

#### 1.3 Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Add deploy user to docker group
usermod -aG docker deploy

# Install Docker Compose
apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version
```

#### 1.4 Configure Firewall

```bash
# Enable UFW
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# Verify
ufw status
```

### Phase 2: Configure DNS

Add DNS records for your domain:

```
Type  | Name          | Value
------|---------------|----------------
A     | analytics     | your-server-ip
A     | errors        | your-server-ip
```

Wait for DNS propagation (can take up to 48 hours, usually faster).

Verify:
```bash
dig analytics.yourdomain.com
dig errors.yourdomain.com
```

### Phase 3: Deploy Analytics Infrastructure

#### 3.1 Clone Repository

```bash
# As deploy user
su - deploy

# Clone repository
git clone https://github.com/sbozh-me/website.git
cd website/deploy/analytics
```

#### 3.2 Configure Production Environment

```bash
# Copy example environment
cp .env.example .env.production

# Generate secure secrets
echo "POSTGRES_PASSWORD=$(openssl rand -hex 32)" >> .env.production
echo "UMAMI_APP_SECRET=$(openssl rand -hex 32)" >> .env.production
echo "GLITCHTIP_SECRET_KEY=$(openssl rand -base64 50 | head -c 50)" >> .env.production
```

Edit `.env.production` with production values:

```env
# Production environment
NODE_ENV=production

# Database (use strong password)
POSTGRES_USER=analytics_admin
POSTGRES_PASSWORD=your-very-secure-password-here

# Umami
UMAMI_APP_SECRET=your-32-char-secret
UMAMI_DOMAIN=analytics.yourdomain.com

# GlitchTip
GLITCHTIP_SECRET_KEY=your-50-char-secret
GLITCHTIP_DOMAIN=errors.yourdomain.com

# Email (for GlitchTip alerts)
EMAIL_URL=smtp://user:pass@smtp.provider.com:587
DEFAULT_FROM_EMAIL=alerts@yourdomain.com
```

#### 3.3 Create Production Docker Compose

Create `docker-compose.production.yml`:

```yaml
version: '3.8'

services:
  traefik:
    image: traefik:v2.10
    container_name: traefik
    restart: unless-stopped
    command:
      - "--api.dashboard=false"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.tlschallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.email=your-email@domain.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
      - "--entrypoints.web.http.redirections.entryPoint.to=websecure"
      - "--entrypoints.web.http.redirections.entryPoint.scheme=https"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - traefik-certs:/letsencrypt
    networks:
      - analytics-network

  postgres:
    image: postgres:15-alpine
    container_name: analytics-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init-db.sql:/docker-entrypoint-initdb.d/init-db.sql:ro
    networks:
      - analytics-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: analytics-redis
    restart: unless-stopped
    volumes:
      - redis-data:/data
    networks:
      - analytics-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  umami:
    image: ghcr.io/umami-software/umami:postgresql-latest
    container_name: umami
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/umami_db
      DATABASE_TYPE: postgresql
      APP_SECRET: ${UMAMI_APP_SECRET}
      DISABLE_TELEMETRY: 1
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - analytics-network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.umami.rule=Host(`analytics.yourdomain.com`)"
      - "traefik.http.routers.umami.tls.certresolver=letsencrypt"
      - "traefik.http.services.umami.loadbalancer.server.port=3000"
    deploy:
      resources:
        limits:
          memory: 512M

  glitchtip-web:
    image: glitchtip/glitchtip
    container_name: glitchtip-web
    restart: unless-stopped
    environment:
      DATABASE_URL: postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/glitchtip_db
      SECRET_KEY: ${GLITCHTIP_SECRET_KEY}
      PORT: 8000
      EMAIL_URL: ${EMAIL_URL:-console://}
      DEFAULT_FROM_EMAIL: ${DEFAULT_FROM_EMAIL:-noreply@localhost}
      GLITCHTIP_DOMAIN: https://errors.yourdomain.com
      ENABLE_OPEN_USER_REGISTRATION: "false"
      REDIS_URL: redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - analytics-network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.glitchtip.rule=Host(`errors.yourdomain.com`)"
      - "traefik.http.routers.glitchtip.tls.certresolver=letsencrypt"
      - "traefik.http.services.glitchtip.loadbalancer.server.port=8000"
    deploy:
      resources:
        limits:
          memory: 512M

  glitchtip-worker:
    image: glitchtip/glitchtip
    container_name: glitchtip-worker
    restart: unless-stopped
    command: ./bin/run-celery-with-beat.sh
    environment:
      DATABASE_URL: postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/glitchtip_db
      SECRET_KEY: ${GLITCHTIP_SECRET_KEY}
      REDIS_URL: redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - analytics-network
    deploy:
      resources:
        limits:
          memory: 256M

volumes:
  postgres-data:
  redis-data:
  traefik-certs:

networks:
  analytics-network:
    driver: bridge
```

#### 3.4 Deploy

```bash
# Start services
docker compose -f docker-compose.production.yml --env-file .env.production up -d

# Check status
docker compose -f docker-compose.production.yml ps

# View logs
docker compose -f docker-compose.production.yml logs -f
```

### Phase 4: Configure Services

#### 4.1 Configure Umami

1. Access https://analytics.yourdomain.com
2. Login with admin/umami
3. **Change password immediately**
4. Add production website:
   - Name: `sbozh.me`
   - Domain: `sbozh.me`
5. Copy the Website ID

#### 4.2 Configure GlitchTip

1. Access https://errors.yourdomain.com
2. Create admin account
3. Create organization
4. Create project for production
5. Copy the DSN

### Phase 5: Update Application

#### 5.1 Production Environment Variables

Update your production environment with:

```env
# Analytics
NEXT_PUBLIC_ANALYTICS_ENABLED=true
NEXT_PUBLIC_UMAMI_WEBSITE_ID=production-website-id
NEXT_PUBLIC_UMAMI_SCRIPT_URL=https://analytics.yourdomain.com/script.js

# Error Tracking
NEXT_PUBLIC_GLITCHTIP_DSN=https://key@errors.yourdomain.com/1
```

#### 5.2 Update CSP Headers

In production middleware, update CSP:

```typescript
const cspHeader = `
  script-src 'self' 'unsafe-inline' https://analytics.yourdomain.com;
  connect-src 'self' https://analytics.yourdomain.com https://errors.yourdomain.com;
`
```

#### 5.3 Deploy Application

Deploy your Next.js application with the updated environment variables.

### Phase 6: Verify Production

#### 6.1 Test Tracking

1. Visit your production site
2. Check https://analytics.yourdomain.com for data
3. Verify page views are recording

#### 6.2 Test Error Reporting

```javascript
// In browser console on production
throw new Error('Production test error')
```

Check https://errors.yourdomain.com

#### 6.3 Verify SSL

```bash
curl -I https://analytics.yourdomain.com
curl -I https://errors.yourdomain.com
```

Both should return `HTTP/2 200` with valid certificates.

## Post-Migration Tasks

- [ ] Update monitoring alerts for production URLs
- [ ] Configure backup automation (see below)
- [ ] Update privacy policy with production URLs
- [ ] Set up uptime monitoring
- [ ] Document runbook for on-call team
- [ ] Test disaster recovery procedure

### Automated Backups

Create `/home/deploy/scripts/backup-analytics.sh`:

```bash
#!/bin/bash
BACKUP_DIR=/home/deploy/backups
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup PostgreSQL
docker exec analytics-postgres pg_dumpall -U analytics_admin > $BACKUP_DIR/postgres_$DATE.sql

# Compress
gzip $BACKUP_DIR/postgres_$DATE.sql

# Keep last 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/postgres_$DATE.sql.gz"
```

Add to crontab:
```bash
chmod +x /home/deploy/scripts/backup-analytics.sh
crontab -e
# Add: 0 2 * * * /home/deploy/scripts/backup-analytics.sh
```

## Rollback Procedure

If issues arise:

```bash
# Stop production services
docker compose -f docker-compose.production.yml down

# Restore from backup if needed
docker compose -f docker-compose.production.yml up -d postgres
cat backup.sql.gz | gunzip | docker exec -i analytics-postgres psql -U analytics_admin

# Restart all services
docker compose -f docker-compose.production.yml up -d
```

## Breaking Changes

None expected. The migration is infrastructure-focused and the analytics API remains the same.

## Support

For migration issues:
1. Check logs: `docker compose logs service-name`
2. Review this guide
3. Open issue: https://github.com/sbozh-me/website/issues
