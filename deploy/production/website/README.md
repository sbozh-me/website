# sbozh.me Deployment Guide

Complete guide to deploy sbozh.me to Hetzner Cloud in **2-3 hours**.

## Overview

This deployment uses:
- **Hetzner Cloud VPS** (CPX21 - 4GB RAM, ~€8/month)
- **Terraform** for infrastructure automation
- **Docker Compose** for application orchestration
- **Nginx** as reverse proxy
- **Let's Encrypt** for SSL certificates

## Architecture

```
Internet → Nginx (443) → Directus (8055) → PostgreSQL + Redis
         SSL/HTTPS
```

## Prerequisites

### 1. Hetzner Cloud Account
- Sign up at: https://console.hetzner.cloud/
- Create API Token: Console → Security → API Tokens → Generate

### 2. Domain Name (Optional but Recommended)
- Any domain registrar (Cloudflare, Namecheap, etc.)
- Access to DNS settings

### 3. Local Tools
```bash
# macOS
brew install terraform

# Linux
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install terraform
```

### 4. SSH Key
```bash
# Generate if you don't have one
ssh-keygen -t ed25519 -C "sbozh-me-deploy" -f ~/.ssh/sbozh_me
```

## Deployment Steps

### Step 1: Configure Infrastructure (15 min)

Navigate to terraform directory:
```bash
cd apps/sbozh-me/terraform
```

Create and configure variables:
```bash
cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars
```

Set these values:
```hcl
hcloud_token   = "your-hetzner-api-token"
ssh_public_key = "ssh-ed25519 AAAAC3... your-email@example.com"
domain         = "crm.yourdomain.com"  # Optional
environment    = "prod"
```

Initialize and apply Terraform:
```bash
terraform init
terraform plan
terraform apply
```

Type `yes` when prompted. **This takes 2-3 minutes.**

Save the server IP:
```bash
export SERVER_IP=$(terraform output -raw server_ip)
echo "Server IP: $SERVER_IP"
```

### Step 2: Wait for Server Setup (10 min)

Cloud-init is automatically installing Docker and preparing the server.

Check progress:
```bash
ssh dev@$SERVER_IP "cloud-init status --wait"
```

Verify installation:
```bash
ssh dev@$SERVER_IP "/home/dev/health-check.sh"
```

Expected output:
```
Docker: Docker version 24.x.x
Docker Compose: Docker Compose version v2.x.x
Nginx: nginx version
...
```

### Step 3: Configure Domain (5 min)

**Add DNS A Record:**

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | crm (or @) | YOUR_SERVER_IP | 300 |

Verify DNS propagation:
```bash
dig crm.yourdomain.com
# or
nslookup crm.yourdomain.com
```

Wait until it returns your server IP (usually 1-5 minutes).

### Step 4: Configure Application (10 min)

Navigate to deploy directory:
```bash
cd apps/sbozh-me/deploy
```

Create environment file:
```bash
cp .env.example .env
nano .env
```

**IMPORTANT: Change these values:**
```bash
# Strong passwords (generate with: openssl rand -hex 32)
DB_PASSWORD=your-strong-password-here
DIRECTUS_SECRET=your-random-secret-32-chars
DIRECTUS_KEY=another-random-key-32-chars
ADMIN_PASSWORD=your-admin-password

# Your domain
PUBLIC_URL=https://crm.yourdomain.com
CORS_ORIGIN=https://crm.yourdomain.com

# Your email
ADMIN_EMAIL=admin@yourdomain.com

# Cookie domains
REFRESH_TOKEN_COOKIE_DOMAIN=.yourdomain.com
SESSION_COOKIE_DOMAIN=.yourdomain.com

# SMTP settings (optional, for email)
EMAIL_FROM=noreply@yourdomain.com
EMAIL_SMTP_HOST=smtp.yourdomain.com
EMAIL_SMTP_USER=noreply@yourdomain.com
EMAIL_SMTP_PASSWORD=your-smtp-password
```

### Step 5: Deploy Application (15 min)

Run the deployment script:
```bash
./deploy.sh pifagor.sbozh.me
```

Or without domain (no SSL):
```bash
./deploy.sh
```

**Note:** The script uses the `pifagor` SSH alias from your `~/.ssh/config`

The script will:
1. ✓ Verify SSH connection
2. ✓ Check server readiness
3. ✓ Copy application files
4. ✓ Start Docker containers
5. ✓ Configure Nginx
6. ✓ Obtain SSL certificate
7. ✓ Perform health checks

**Deployment takes 5-10 minutes.**

### Step 6: Access Directus (1 min)

Open your browser:
```
https://crm.yourdomain.com/admin
```

Login with credentials from `.env`:
- Email: `ADMIN_EMAIL`
- Password: `ADMIN_PASSWORD`

## Total Time: 2-2.5 hours

- ⏱️ Step 1 (Terraform): 15 min
- ⏱️ Step 2 (Wait): 10 min
- ⏱️ Step 3 (DNS): 5 min
- ⏱️ Step 4 (Config): 10 min
- ⏱️ Step 5 (Deploy): 15 min
- ⏱️ Step 6 (Access): 1 min

Plus buffer time for DNS propagation and testing.

## Post-Deployment

### Verify Everything Works

```bash
# SSH to server
ssh dev@$SERVER_IP

# Check containers
cd /opt/sbozh-me
docker compose ps

# View logs
docker compose logs -f directus

# Check health
curl http://localhost:8055/server/health
```

### Useful Commands

```bash
# Restart services
ssh dev@$SERVER_IP 'cd /opt/sbozh-me && docker compose restart'

# Stop services
ssh dev@$SERVER_IP 'cd /opt/sbozh-me && docker compose down'

# Start services
ssh dev@$SERVER_IP 'cd /opt/sbozh-me && docker compose up -d'

# View real-time logs
ssh dev@$SERVER_IP 'cd /opt/sbozh-me && docker compose logs -f'

# Check disk usage
ssh dev@$SERVER_IP 'df -h'

# Database backup
ssh dev@$SERVER_IP 'cd /opt/sbozh-me && docker compose exec database pg_dump -U directus sbozh_me > /mnt/sbozh-me-data/backups/backup-$(date +%Y%m%d).sql'
```

### SSL Certificate Renewal

Certificates auto-renew via certbot. To test renewal:
```bash
ssh dev@$SERVER_IP 'sudo certbot renew --dry-run'
```

### Monitoring

Check logs regularly:
```bash
# Application logs
ssh dev@$SERVER_IP 'cd /opt/sbozh-me && docker compose logs -f'

# Nginx logs
ssh dev@$SERVER_IP 'tail -f /var/log/nginx/sbozh-me-access.log'
ssh dev@$SERVER_IP 'tail -f /var/log/nginx/sbozh-me-error.log'

# System resources
ssh dev@$SERVER_IP 'htop'
```

## Troubleshooting

### Can't access Directus

1. Check containers are running:
   ```bash
   ssh dev@$SERVER_IP 'cd /opt/sbozh-me && docker compose ps'
   ```

2. Check logs for errors:
   ```bash
   ssh dev@$SERVER_IP 'cd /opt/sbozh-me && docker compose logs directus'
   ```

3. Verify Nginx is running:
   ```bash
   ssh dev@$SERVER_IP 'sudo systemctl status nginx'
   ```

### SSL certificate failed

1. Verify DNS is pointing to server:
   ```bash
   dig crm.yourdomain.com
   ```

2. Retry certificate:
   ```bash
   ssh dev@$SERVER_IP 'sudo certbot certonly --webroot -w /var/www/certbot -d crm.yourdomain.com --email admin@yourdomain.com --agree-tos'
   ```

3. Reload Nginx:
   ```bash
   ssh dev@$SERVER_IP 'sudo systemctl reload nginx'
   ```

### Database connection errors

1. Check PostgreSQL logs:
   ```bash
   ssh dev@$SERVER_IP 'cd /opt/sbozh-me && docker compose logs database'
   ```

2. Verify database is healthy:
   ```bash
   ssh dev@$SERVER_IP 'cd /opt/sbozh-me && docker compose exec database pg_isready -U directus'
   ```

### Out of disk space

1. Check disk usage:
   ```bash
   ssh dev@$SERVER_IP 'df -h'
   ```

2. Clean Docker:
   ```bash
   ssh dev@$SERVER_IP 'docker system prune -a'
   ```

3. Clean old logs:
   ```bash
   ssh dev@$SERVER_IP 'journalctl --vacuum-time=7d'
   ```

## Scaling Up

If you need more resources later:

1. **Resize server** (in Hetzner Console or via Terraform)
2. **Add more volume space** (in Hetzner Console)
3. **Upgrade to separate DB server** (modify docker-compose to use external PostgreSQL)

## Backup Strategy

### Automated Backups

Create a backup cron job:
```bash
ssh dev@$SERVER_IP

# Create backup script
cat > /root/backup-sbozh-me.sh <<'EOF'
#!/bin/bash
BACKUP_DIR="/mnt/sbozh-me-data/backups"
DATE=$(date +%Y%m%d-%H%M%S)

# Database backup
docker compose -f /opt/sbozh-me/docker-compose.yaml exec -T database \
  pg_dump -U directus sbozh_me | gzip > $BACKUP_DIR/db-$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "db-*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/db-$DATE.sql.gz"
EOF

chmod +x /root/backup-sbozh-me.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /root/backup-sbozh-me.sh") | crontab -
```

## Security Checklist

- ✅ Firewall configured (SSH, HTTP, HTTPS only)
- ✅ SSL certificate installed
- ✅ Strong passwords in .env
- ✅ Rate limiting enabled in Nginx
- ✅ Security headers configured
- ✅ Automatic security updates enabled
- ✅ Docker containers run as non-root (where possible)

## Cost Breakdown

- Hetzner Cloud VPS (CPX21): **€8.21/month**
- Volume (50GB): **€2.40/month**
- **Total: ~€10.61/month**

## CI/CD Configuration

### GitHub Container Registry (GHCR)

The Next.js app is built and pushed to GHCR via GitHub Actions on:
- Every push to `main` branch → `ghcr.io/sbozh-me/website:main`
- Version tags (v*) → `ghcr.io/sbozh-me/website:0.11.0`

### Docker Compose Configuration

#### Image Tag

Control which image version to deploy via the `WEB_IMAGE_TAG` environment variable:

```bash
# In .env file
WEB_IMAGE_TAG=main          # Latest from main branch
WEB_IMAGE_TAG=0.11.0        # Specific version
WEB_IMAGE_TAG=sha-abc1234   # Specific commit
```

#### Runtime Environment Variables

These are configured in docker-compose and read at runtime (no rebuild needed):

| Variable | Description | Example |
|----------|-------------|---------|
| `DIRECTUS_URL` | Directus API URL | `https://directus.sbozh.me` |
| `UMAMI_WEBSITE_ID` | Umami website ID | `abc123-...` |
| `UMAMI_SCRIPT_URL` | Umami script URL | `https://analytics.sbozh.me/script.js` |
| `ANALYTICS_ENABLED` | Enable analytics | `true` |

The app exposes these via `/api/config` endpoint for client-side access.

### GitOps Deployment

Deployments are controlled by `manifest.yaml`. When this file changes, GitHub Actions automatically deploys.

**manifest.yaml:**
```yaml
web:
  image: ghcr.io/sbozh-me/website
  tag: main  # Change this to deploy a new version
```

**Automatic deploy:** Push a change to `manifest.yaml` on main branch.

**Manual deploy via SSH:**
```bash
ssh oktavian@your-server '/opt/sbozh-me/scripts/deploy-web.sh v0.11.1'
```

**Required GitHub Secrets for automated deploys:**

| Secret | Description |
|--------|-------------|
| `DEPLOY_SSH_KEY` | Private SSH key for server access |
| `DEPLOY_HOST` | Server IP or hostname |
| `DEPLOY_USER` | SSH user (`oktavian`) |

## Analytics (Umami)

### Configuration

Umami shares the PostgreSQL instance with Directus. Configure in `.env`:

```bash
UMAMI_DB_USER=umami
UMAMI_DB_PASSWORD=your-secure-password
UMAMI_DB_NAME=umami
UMAMI_APP_SECRET=your-32-char-secret
UMAMI_WEBSITE_ID=  # Get from Umami dashboard
UMAMI_SCRIPT_URL=https://analytics.sbozh.me/script.js
ANALYTICS_ENABLED=true
```

### First-Time Setup

**For existing servers** (database already running):
```bash
ssh oktavian@your-server '/opt/sbozh-me/scripts/init-umami.sh'
ssh oktavian@your-server 'cd /opt/sbozh-me && docker compose up -d umami'
```

**For new servers**, the init script runs automatically on first `docker compose up`.

### Access Umami Dashboard

1. Navigate to `http://SERVER_IP:3001` (or `https://analytics.sbozh.me` after nginx setup)
2. Login with default credentials: `admin` / `umami`
3. **Change password immediately**
4. Add website: Settings → Websites → Add website
5. Copy the Website ID to your `.env` as `UMAMI_WEBSITE_ID`

### Useful Commands

```bash
# View Umami logs
ssh oktavian@your-server 'cd /opt/sbozh-me && docker compose logs -f umami'

# Restart Umami
ssh oktavian@your-server 'cd /opt/sbozh-me && docker compose restart umami'

# Check Umami health
ssh oktavian@your-server 'curl -s http://localhost:3001/api/heartbeat'
```

## SSL & Domain Configuration

### Domain Mapping

| Domain | Service | Port |
|--------|---------|------|
| sbozh.me | Web (Next.js) | 3000 |
| directus.sbozh.me | Directus CMS | 8055 |
| analytics.sbozh.me | Umami Analytics | 3001 |

### DNS Records (Cloudflare)

Add these A records pointing to your server IP:

| Type | Name | Value |
|------|------|-------|
| A | @ | SERVER_IP |
| A | directus | SERVER_IP |
| A | analytics | SERVER_IP |

### Wildcard SSL Certificate Setup

We use a wildcard certificate (*.sbozh.me + sbozh.me) via Cloudflare DNS-01 challenge.

**1. Create Cloudflare API Token:**
- Go to https://dash.cloudflare.com/profile/api-tokens
- Create Custom Token with permissions: `Zone:DNS:Edit` for sbozh.me

**2. Configure credentials on server:**
```bash
ssh oktavian@your-server

# Create credentials file (as root)
sudo bash -c 'echo "dns_cloudflare_api_token = YOUR_TOKEN" > /root/.cloudflare.ini'
sudo chmod 600 /root/.cloudflare.ini
```

**3. Obtain certificate:**
```bash
sudo /opt/sbozh-me/scripts/setup-ssl.sh admin@sbozh.me
```

**4. Deploy nginx config:**
```bash
sudo cp /opt/sbozh-me/nginx.conf.template /etc/nginx/sites-available/sbozh-me.conf
sudo ln -sf /etc/nginx/sites-available/sbozh-me.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

### Certificate Renewal

Certificates auto-renew via certbot timer. To test:
```bash
sudo certbot renew --dry-run
```

## Next Steps

1. ✅ Deploy completed
2. → Configure Directus (collections, fields, permissions)
3. → Set up regular backups
4. → Configure monitoring (optional)
5. → Deploy frontend application

## Support

For issues:
- Check logs first
- Review troubleshooting section
- Hetzner Support: https://docs.hetzner.com/
- Directus Docs: https://docs.directus.io/
