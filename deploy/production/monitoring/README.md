# GlitchTip Error Tracking - Production Deployment

Deploy GlitchTip error tracking to a separate Hetzner Cloud server at `monitoring.sbozh.me`.

## Overview

- **Service**: [GlitchTip](https://glitchtip.com/) (Sentry-compatible error tracking)
- **Server**: Hetzner Cloud VPS (CPX11 - 2GB RAM, ~€4/month)
- **Domain**: monitoring.sbozh.me
- **SSL**: Wildcard certificate (*.sbozh.me) via Cloudflare DNS-01

## Architecture

```
Internet → Nginx (443) → GlitchTip (8000) → PostgreSQL + Redis
         SSL/HTTPS
```

**Services:**
- GlitchTip Web (dashboard + API)
- GlitchTip Worker (Celery background tasks)
- PostgreSQL 16 (database)
- Redis 7 (cache + task queue)

## Prerequisites

### 1. Hetzner Cloud Account
- Sign up at: https://console.hetzner.cloud/
- Create API Token: Console → Security → API Tokens → Generate

### 2. Cloudflare API Token
- Go to https://dash.cloudflare.com/profile/api-tokens
- Create Custom Token with: `Zone:DNS:Edit` for sbozh.me

### 3. SSH Key
```bash
ssh-keygen -t ed25519 -C "monitoring-deploy" -f ~/.ssh/monitoring
```

### 4. DNS Record
Add A record in Cloudflare:
| Type | Name | Value |
|------|------|-------|
| A | monitoring | YOUR_SERVER_IP |

## Deployment Steps

### Step 1: Provision Infrastructure (10 min)

```bash
cd terraform

# Configure variables
cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars  # Set hcloud_token, ssh_public_key

# Deploy
terraform init
terraform apply
```

Save the server IP from the output.

### Step 2: Configure SSH (2 min)

Add to `~/.ssh/config`:
```
Host monitoring
    HostName YOUR_SERVER_IP
    User oktavian
    IdentityFile ~/.ssh/monitoring
```

### Step 3: Wait for Server Setup (5 min)

```bash
ssh monitoring "cloud-init status --wait"
```

### Step 4: Configure Application (5 min)

```bash
cd ..  # Back to deploy/production/monitoring

# Create environment file
cp .env.example .env
nano .env
```

Generate secrets:
```bash
# POSTGRES_PASSWORD
openssl rand -base64 24 | tr -d '/+=' | head -c 32

# SECRET_KEY
openssl rand -hex 32
```

### Step 5: Setup Cloudflare Credentials (2 min)

```bash
ssh monitoring

# Create credentials file
sudo bash -c 'echo "dns_cloudflare_api_token = YOUR_TOKEN" > /root/.cloudflare.ini'
sudo chmod 600 /root/.cloudflare.ini
exit
```

### Step 6: Deploy (5 min)

```bash
./deploy.sh monitoring.sbozh.me
```

The script will:
1. Copy files to server
2. Start Docker containers
3. Obtain SSL certificate
4. Configure Nginx

### Step 7: Initial Setup (5 min)

1. Navigate to https://monitoring.sbozh.me
2. Create admin account (first user becomes admin)
3. Create organization (e.g., "sbozh")
4. Create project (select "Next.js" or "Browser JavaScript")
5. Copy the DSN from project settings

## Next.js Integration

### Install Sentry SDK

```bash
pnpm add @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

### Configure DSN

Add to `.env.local`:
```env
NEXT_PUBLIC_GLITCHTIP_DSN=https://YOUR_KEY@monitoring.sbozh.me/1
SENTRY_DSN=https://YOUR_KEY@monitoring.sbozh.me/1
```

## Common Commands

```bash
# SSH to server
ssh monitoring

# View logs
cd /opt/monitoring && docker compose logs -f

# Restart services
docker compose restart

# Check status
docker compose ps

# Backup database
./scripts/create-backup.sh
```

## Resource Requirements

| Service | Memory |
|---------|--------|
| PostgreSQL | ~100MB |
| Redis | ~50MB |
| GlitchTip Web | ~300MB |
| GlitchTip Worker | ~200MB |
| **Total** | **~650MB** |

Recommended: CPX11 (2GB RAM) or CPX21 (4GB RAM)

## Cost

- Hetzner CPX11: **€4.35/month**
- Volume (20GB): **€0.96/month**
- **Total: ~€5.31/month**

## Troubleshooting

### Services not starting

```bash
ssh monitoring
cd /opt/monitoring
docker compose logs -f
```

### SSL certificate issues

```bash
# Check certificate
sudo certbot certificates

# Renew manually
sudo certbot renew --dry-run
```

### Database issues

```bash
# Check PostgreSQL
docker compose exec database pg_isready -U glitchtip

# Access database
docker compose exec database psql -U glitchtip glitchtip
```

## Security Checklist

- [ ] Change default secrets in `.env`
- [ ] Disable open registration (`ENABLE_OPEN_USER_REGISTRATION=False`)
- [ ] Configure SMTP for email alerts
- [ ] Set up regular backups
- [ ] Review rate limiting in nginx config
