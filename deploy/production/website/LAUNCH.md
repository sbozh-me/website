# Production Deployment Guide

Complete step-by-step guide to deploy sbozh.me to production.

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [GitHub Secrets Configuration](#2-github-secrets-configuration)
3. [Infrastructure Provisioning (Terraform)](#3-infrastructure-provisioning-terraform)
4. [DNS Configuration (Cloudflare)](#4-dns-configuration-cloudflare)
5. [Environment Configuration](#5-environment-configuration)
6. [Cloudflare API Token Setup](#6-cloudflare-api-token-setup)
7. [Initial Deployment](#7-initial-deployment)
8. [Post-Deployment Verification](#8-post-deployment-verification)
9. [GitOps Deployment Flow](#9-gitops-deployment-flow)
10. [Backup & Restore](#10-backup--restore)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Prerequisites

### Required Accounts

- [ ] **Hetzner Cloud** - https://console.hetzner.cloud
- [ ] **Cloudflare** - https://dash.cloudflare.com (domain DNS management)
- [ ] **GitHub** - Repository access with Actions enabled

### Local Tools

```bash
# Terraform (infrastructure provisioning)
brew install terraform

# SSH client (already on macOS/Linux)
ssh -V

# Optional: Hetzner CLI
brew install hcloud
```

### Generate SSH Key (if needed)

```bash
# Generate Ed25519 key pair
ssh-keygen -t ed25519 -C "your-email@example.com" -f ~/.ssh/sbozh-me

# View public key (needed for Terraform)
cat ~/.ssh/sbozh-me.pub
```

---

## 2. GitHub Secrets Configuration

Navigate to: **Repository Settings > Secrets and variables > Actions > New repository secret**

### Required Secrets

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `DEPLOY_HOST` | Production server IP address | From Terraform output |
| `DEPLOY_USER` | SSH username | `oktavian` (default) |
| `DEPLOY_SSH_KEY` | Private SSH key for deployment | [Step 2.1](#21-create-deploy_ssh_key) |

> **Note:** `GITHUB_TOKEN` is automatically provided by GitHub Actions for GHCR authentication. No manual token needed.

### 2.1 Create DEPLOY_SSH_KEY

```bash
# Copy your private key content
cat ~/.ssh/sbozh-me

# Paste the ENTIRE content (including -----BEGIN/END-----) as DEPLOY_SSH_KEY secret
```

### 2.2 Create GitHub PAT for GHCR (Server Authentication)

The server needs to authenticate with GitHub Container Registry to pull private images.

1. Go to https://github.com/settings/tokens
2. Click **Generate new token (classic)**
3. Name: `ghcr-server-read`
4. Expiration: No expiration (or set reminder to rotate)
5. Select scope: **`read:packages`** only
6. Click **Generate token**
7. Copy the token immediately (shown only once!)

**Save this token** - you'll need it during server setup (Section 3.5).

---

## 3. Infrastructure Provisioning (Terraform)

### 3.1 Get Hetzner API Token

1. Go to https://console.hetzner.cloud
2. Select your project (or create one)
3. Go to **Security > API Tokens**
4. Click **Generate API Token**
5. Name: `sbozh-me-terraform`
6. Permissions: **Read & Write**
7. Copy the token immediately (shown only once!)

### 3.2 Configure Terraform Variables

```bash
cd deploy/production/terraform

# Copy example configuration
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:

```hcl
hcloud_token   = "YOUR_HETZNER_API_TOKEN"
ssh_public_key = "ssh-ed25519 AAAAC3... your-email@example.com"
root_password  = "your-strong-root-password"
domain         = "sbozh.me"
environment    = "prod"
server_type    = "cpx21"    # 3 vCPU, 4GB RAM
location       = "nbg1"     # Nuremberg
volume_size    = 50         # GB
```

### 3.3 Provision Infrastructure

```bash
# Initialize Terraform
terraform init

# Preview changes
terraform plan

# Apply (creates server + volume)
terraform apply
```

**Output example:**
```
server_ip = "65.108.xxx.xxx"
server_ipv6 = "2a01:4f8:xxx::1"
ssh_command = "ssh oktavian@65.108.xxx.xxx"
volume_path = "/mnt/sbozh-me-data"
```

### 3.4 Wait for Cloud-Init

The server runs automated setup (Docker, Nginx, firewall, etc.). Wait for completion:

```bash
# Check if cloud-init is done (returns when complete)
ssh oktavian@SERVER_IP "cloud-init status --wait"

# Or check the completion marker
ssh oktavian@SERVER_IP "cat ~/cloud-init-completed.txt"
```

**Typical wait time: 5-10 minutes**

### 3.5 Configure SSH Alias

Add to `~/.ssh/config`:

```
Host sbozhme
    HostName 65.108.xxx.xxx
    User oktavian
    IdentityFile ~/.ssh/sbozh-me
    StrictHostKeyChecking no
```

Test connection:

```bash
ssh sbozhme "echo 'SSH OK'"
```

### 3.6 Login to GHCR on Server

The server needs to authenticate with GitHub Container Registry to pull private images:

```bash
ssh sbozhme

# Login to GHCR (use the PAT from Section 2.2)
echo "ghp_xxxxxxxxxxxx" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# Verify login
docker pull ghcr.io/sbozh-me/website:main
```

> **Note:** This login persists in `~/.docker/config.json`. You only need to do this once per server.

### 3.7 Update GitHub Secrets

Now that you have the server IP, add to GitHub Secrets:

- `DEPLOY_HOST` = `65.108.xxx.xxx`
- `DEPLOY_USER` = `oktavian`

---

## 4. DNS Configuration (Cloudflare)

### 4.1 Add A Records

Go to **Cloudflare Dashboard > Your Domain > DNS**

| Type | Name | Content | Proxy | TTL |
|------|------|---------|-------|-----|
| A | `@` | `65.108.xxx.xxx` | DNS only (gray cloud) | Auto |
| A | `directus` | `65.108.xxx.xxx` | DNS only | Auto |
| A | `analytics` | `65.108.xxx.xxx` | DNS only | Auto |

**Important:** Keep proxy OFF (gray cloud) for SSL certificate validation.

### 4.2 Verify DNS Propagation

```bash
# Check each subdomain
dig sbozh.me +short
dig directus.sbozh.me +short
dig analytics.sbozh.me +short

# All should return your server IP
```

---

## 5. Environment Configuration

### 5.1 Create .env File

```bash
cd deploy/production

# Copy template
cp .env.example .env
```

### 5.2 Generate Secrets

```bash
# Generate 32-character random strings
openssl rand -hex 32  # For DIRECTUS_SECRET
openssl rand -hex 32  # For DIRECTUS_KEY
openssl rand -hex 32  # For UMAMI_APP_SECRET
```

### 5.3 Configure .env

Edit `.env` with your values:

```bash
# =============================================================================
# DATABASE
# =============================================================================
DB_USER=directus
DB_PASSWORD=your-strong-db-password
DB_DATABASE=sbozh_me

# =============================================================================
# DIRECTUS CORE
# =============================================================================
DIRECTUS_SECRET=your-32-char-secret
DIRECTUS_KEY=your-32-char-key

# =============================================================================
# ADMIN ACCOUNT
# =============================================================================
ADMIN_EMAIL=admin@sbozh.me
ADMIN_PASSWORD=your-admin-password

# =============================================================================
# PUBLIC URLs & CORS
# =============================================================================
PUBLIC_URL=https://directus.sbozh.me
CORS_ORIGIN=https://directus.sbozh.me,https://sbozh.me
REFRESH_TOKEN_COOKIE_DOMAIN=.sbozh.me
SESSION_COOKIE_DOMAIN=.sbozh.me

# =============================================================================
# SECURITY (HTTPS)
# =============================================================================
REFRESH_TOKEN_COOKIE_SECURE=true
REFRESH_TOKEN_COOKIE_SAME_SITE=lax
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_SAME_SITE=lax

# =============================================================================
# CACHE
# =============================================================================
CACHE_ENABLED=true
CACHE_AUTO_PURGE=true

# =============================================================================
# WEBSOCKETS
# =============================================================================
WEBSOCKETS_ENABLED=true

# =============================================================================
# EMAIL (SMTP)
# =============================================================================
EMAIL_TRANSPORT=smtp
EMAIL_FROM=noreply@sbozh.me
EMAIL_SMTP_HOST=smtp.your-provider.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=your-smtp-user
EMAIL_SMTP_PASSWORD=your-smtp-password
EMAIL_SMTP_SECURE=true

# =============================================================================
# DISCORD NOTIFICATIONS
# =============================================================================
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxx/yyy
RATE_LIMIT_PER_HOUR=10

# =============================================================================
# UMAMI ANALYTICS
# =============================================================================
UMAMI_DB_USER=umami
UMAMI_DB_PASSWORD=your-umami-db-password
UMAMI_DB_NAME=umami
UMAMI_APP_SECRET=your-32-char-secret
UMAMI_WEBSITE_ID=configure-after-setup
UMAMI_SCRIPT_URL=https://analytics.sbozh.me/script.js
ANALYTICS_ENABLED=true

# =============================================================================
# WEB SERVICE
# =============================================================================
WEB_IMAGE_TAG=main
DIRECTUS_URL=https://directus.sbozh.me
DEPLOYMENT_ENV=prod

# =============================================================================
# LOGGING
# =============================================================================
LOG_LEVEL=info
```

---

## 6. Cloudflare API Token Setup

SSL certificates require Cloudflare DNS validation for wildcard domains.

### 6.1 Create API Token

1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click **Create Token**
3. Use template: **Edit zone DNS**
4. Configure:
   - **Zone Resources:** Include > Specific zone > `sbozh.me`
   - **Permissions:** Zone > DNS > Edit
5. Click **Continue to summary** > **Create Token**
6. Copy the token immediately!

### 6.2 Configure Server Credentials

SSH to server and create credentials file:

```bash
ssh sbozhme

# Create Cloudflare credentials
sudo bash -c 'echo "dns_cloudflare_api_token = YOUR_CLOUDFLARE_TOKEN" > /root/.cloudflare.ini'
sudo chmod 600 /root/.cloudflare.ini

# Verify
sudo cat /root/.cloudflare.ini
```

---

## 7. Initial Deployment

### 7.1 Run Deployment Script

```bash
cd deploy/production

# Deploy with domain (includes SSL setup)
./deploy.sh sbozh.me
```

### 7.2 What deploy.sh Does

1. Verifies SSH connection
2. Waits for cloud-init completion
3. Creates `/opt/sbozh-me` directory
4. Uploads:
   - docker-compose.yaml
   - .env file
   - Directus source
   - Services source
   - Deployment scripts
5. Builds Docker images
6. Starts containers
7. Checks for SSL certificate:
   - **Exists:** Deploys full nginx SSL config
   - **Missing:** Runs `setup-ssl.sh` for wildcard cert via Cloudflare DNS
8. Configures nginx with SSL
9. Enables nginx at boot
10. Runs health check

**Typical time: 5-10 minutes**

### 7.3 Manual SSL Setup (if skipped)

If Cloudflare credentials weren't configured:

```bash
# SSH to server
ssh sbozhme

# Configure Cloudflare credentials (see section 6.2)
sudo bash -c 'echo "dns_cloudflare_api_token = TOKEN" > /root/.cloudflare.ini'
sudo chmod 600 /root/.cloudflare.ini

# Run SSL setup
sudo /opt/sbozh-me/scripts/setup-ssl.sh admin@sbozh.me

# Deploy nginx config
sudo cp /opt/sbozh-me/nginx.conf.template /etc/nginx/sites-available/sbozh-me
sudo ln -sf /etc/nginx/sites-available/sbozh-me /etc/nginx/sites-enabled/sbozh-me
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx
```

---

## 8. Post-Deployment Verification

### 8.1 Check Container Status

```bash
ssh sbozhme "cd /opt/sbozh-me && docker compose ps"
```

Expected output:
```
NAME       STATUS
database   Up (healthy)
cache      Up (healthy)
directus   Up (healthy)
web        Up (healthy)
umami      Up (healthy)
```

### 8.2 Check Service Health

```bash
# Directus health
curl -s https://directus.sbozh.me/server/health | jq

# Web app
curl -s -o /dev/null -w "%{http_code}" https://sbozh.me

# Umami health
curl -s https://analytics.sbozh.me/api/heartbeat
```

### 8.3 Verify SSL Certificate

```bash
# Check certificate details
echo | openssl s_client -servername sbozh.me -connect sbozh.me:443 2>/dev/null | openssl x509 -noout -dates -subject

# Should show wildcard cert for *.sbozh.me
```

### 8.4 Access Admin Panels

| Service | URL | Default Credentials |
|---------|-----|---------------------|
| Directus | https://directus.sbozh.me/admin | From .env (ADMIN_EMAIL/PASSWORD) |
| Umami | https://analytics.sbozh.me | `admin` / `umami` (change immediately!) |

### 8.5 Configure Umami Website ID

1. Login to https://analytics.sbozh.me
2. Go to **Settings > Websites > Add website**
3. Enter domain: `sbozh.me`
4. Copy the **Website ID**
5. Update `.env` on server:
   ```bash
   ssh sbozhme "sed -i 's/UMAMI_WEBSITE_ID=.*/UMAMI_WEBSITE_ID=your-website-id/' /opt/sbozh-me/.env"
   ssh sbozhme "cd /opt/sbozh-me && docker compose restart web"
   ```

---

## 9. GitOps Deployment Flow

### 9.1 How It Works

```
1. Push code to main branch
   ↓
2. GitHub Actions builds Docker image
   → ghcr.io/sbozh-me/website:main
   ↓
3. Update manifest.yaml with new tag
   ↓
4. Push manifest change
   ↓
5. GitHub Actions deploys to server
   → Runs deploy-web.sh on server
```

### 9.2 Deploy a New Version

**Option A: Deploy latest main branch**

```bash
# Just rebuild - the image is already tagged as :main
# Push any code change to trigger rebuild
git push origin main
```

**Option B: Deploy specific version**

Edit `deploy/production/manifest.yaml`:

```yaml
web:
  image: ghcr.io/sbozh-me/website
  tag: v0.11.7  # Change to desired version
```

Commit and push:

```bash
git add deploy/production/manifest.yaml
git commit -m "deploy: update web to v0.11.7"
git push origin main
```

### 9.3 Manual Deployment

```bash
# SSH to server and run deploy script
ssh sbozhme "sudo /opt/sbozh-me/scripts/deploy-web.sh v0.11.7"
```

---

## 10. Backup & Restore

### 10.1 Create Backup

```bash
# SSH to server
ssh sbozhme

# Run backup script
sudo /opt/sbozh-me/scripts/create-backup.sh
```

**Backup includes:**
- PostgreSQL dump (all databases)
- `/mnt/sbozh-me-data/postgres/`
- `/mnt/sbozh-me-data/directus/uploads/`

**Location:** `/mnt/sbozh-me-data/backups/`
**Retention:** Last 7 backups kept

### 10.2 Download Backup Locally

```bash
# Download latest backup
rsync -avz sbozhme:/mnt/sbozh-me-data/backups/ ~/backups/sbozh-me/
```

### 10.3 Restore from Backup

```bash
ssh sbozhme

# Stop services
cd /opt/sbozh-me && docker compose down

# Extract backup
cd /mnt/sbozh-me-data/backups
tar -xzf sbozh-me-backup-YYYYMMDD-full.tar.gz

# Restore PostgreSQL
docker compose up -d database
cat postgres-dump.sql | docker compose exec -T database psql -U directus

# Restore data directories
sudo cp -r postgres/* /mnt/sbozh-me-data/postgres/
sudo cp -r directus/* /mnt/sbozh-me-data/directus/

# Start all services
docker compose up -d
```

### 10.4 Scheduled Backups (Cron)

```bash
ssh sbozhme

# Edit crontab
crontab -e

# Add daily backup at 3 AM
0 3 * * * /opt/sbozh-me/scripts/create-backup.sh >> /var/log/sbozh-me-backup.log 2>&1
```

---

## 11. Troubleshooting

### Container Issues

```bash
# View all logs
ssh sbozhme "cd /opt/sbozh-me && docker compose logs -f"

# View specific service
ssh sbozhme "cd /opt/sbozh-me && docker compose logs -f directus"

# Restart specific service
ssh sbozhme "cd /opt/sbozh-me && docker compose restart web"

# Rebuild and restart
ssh sbozhme "cd /opt/sbozh-me && docker compose up -d --build directus"
```

### Nginx Issues

```bash
# Test configuration
ssh sbozhme "sudo nginx -t"

# View error logs
ssh sbozhme "sudo tail -f /var/log/nginx/error.log"

# View access logs
ssh sbozhme "sudo tail -f /var/log/nginx/sbozh-me-web-access.log"
```

### SSL Certificate Issues

```bash
# Check certificate expiry
ssh sbozhme "sudo certbot certificates"

# Force renewal
ssh sbozhme "sudo certbot renew --force-renewal"

# Check Cloudflare credentials
ssh sbozhme "sudo cat /root/.cloudflare.ini"
```

### Database Issues

```bash
# Connect to PostgreSQL
ssh sbozhme "cd /opt/sbozh-me && docker compose exec database psql -U directus -d sbozh_me"

# Check database size
ssh sbozhme "cd /opt/sbozh-me && docker compose exec database psql -U directus -c \"SELECT pg_size_pretty(pg_database_size('sbozh_me'));\""
```

### Disk Space

```bash
# Check volume usage
ssh sbozhme "df -h /mnt/sbozh-me-data"

# Check Docker disk usage
ssh sbozhme "docker system df"

# Clean up Docker
ssh sbozhme "docker system prune -af"
```

### Health Check Commands

```bash
# All-in-one health check
ssh sbozhme "cd /opt/sbozh-me && docker compose ps && echo '---' && curl -s localhost:8055/server/health | jq && echo '---' && curl -s localhost:3000 -o /dev/null -w '%{http_code}\n'"
```

---

## Quick Reference

### URLs

| Service | URL |
|---------|-----|
| Web App | https://sbozh.me |
| Directus CMS | https://directus.sbozh.me |
| Directus Admin | https://directus.sbozh.me/admin |
| Umami Analytics | https://analytics.sbozh.me |

### SSH Commands

```bash
# Connect
ssh sbozhme

# View logs
ssh sbozhme "cd /opt/sbozh-me && docker compose logs -f"

# Restart all
ssh sbozhme "cd /opt/sbozh-me && docker compose restart"

# Status
ssh sbozhme "cd /opt/sbozh-me && docker compose ps"
```

### Key Paths (Server)

| Path | Purpose |
|------|---------|
| `/opt/sbozh-me/` | Application files |
| `/mnt/sbozh-me-data/postgres/` | PostgreSQL data |
| `/mnt/sbozh-me-data/directus/uploads/` | CMS uploads |
| `/mnt/sbozh-me-data/backups/` | Backup archives |
| `/etc/letsencrypt/live/sbozh.me/` | SSL certificates |
| `/root/.cloudflare.ini` | Cloudflare API token |

### Key Files (Local)

| File | Purpose |
|------|---------|
| `deploy/production/.env` | Environment configuration |
| `deploy/production/manifest.yaml` | GitOps deployment trigger |
| `deploy/production/terraform/terraform.tfvars` | Infrastructure config |
