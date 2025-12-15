# Analytics Setup Guide

Complete setup guide for the analytics infrastructure, including Next.js integration and testing.

## Table of Contents

- [Prerequisites](#prerequisites)
- [1. Infrastructure Setup](#1-infrastructure-setup)
- [2. Umami Configuration](#2-umami-configuration)
- [3. GlitchTip Configuration](#3-glitchtip-configuration)
- [4. Next.js Integration](#4-nextjs-integration)
- [5. Testing the Integration](#5-testing-the-integration)
- [6. Privacy Settings](#6-privacy-settings)
- [Environment Variables Reference](#environment-variables-reference)
- [Data Retention](#data-retention)
- [Troubleshooting](#troubleshooting)
- [Maintenance](#maintenance)

## Prerequisites

Before starting, ensure you have:

- Docker Desktop 4.x+ with Docker Compose
- Node.js 18+ and pnpm
- At least 2GB available RAM
- Ports 3001 and 3002 available

Verify Docker is running:
```bash
docker --version
docker-compose --version
```

## 1. Infrastructure Setup

### Clone and Configure

```bash
# Navigate to analytics directory
cd deploy/analytics

# Copy environment template
cp .env.example .env
```

### Generate Secure Secrets

```bash
# Generate UMAMI_APP_SECRET (32 characters)
openssl rand -hex 16

# Generate GLITCHTIP_SECRET_KEY (50 characters)
openssl rand -base64 38 | head -c 50

# Generate database password
openssl rand -hex 16
```

### Update .env File

Edit `.env` with your generated values:
```env
# Database
POSTGRES_PASSWORD=your-generated-password

# Umami
UMAMI_APP_SECRET=your-32-char-secret

# GlitchTip
GLITCHTIP_SECRET_KEY=your-50-char-secret
```

### Start Services

```bash
# Start all services in detached mode
docker-compose up -d

# Verify services are running
docker-compose ps

# Expected output:
# analytics-postgres  running (healthy)
# analytics-redis     running (healthy)
# umami               running (healthy)
# glitchtip-web       running (healthy)
# glitchtip-worker    running
```

Wait 30-60 seconds for initial database setup to complete.

## 2. Umami Configuration

### Initial Access

1. Open http://localhost:3001 in your browser
2. Login with default credentials:
   - Username: `admin`
   - Password: `umami`

### IMPORTANT: Change Admin Password

1. Click the user icon (top right)
2. Select "Profile"
3. Change password to a secure one
4. Save changes

### Add Your Website

1. Go to Settings → Websites
2. Click "Add website"
3. Fill in:
   - **Name**: `sbozh.me Development`
   - **Domain**: `localhost` (or `sbozh.me` for production)
4. Click "Save"
5. **Copy the Website ID** - you'll need this for Next.js

The Website ID looks like: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

### Verify Tracking Script

Test the script URL in your browser:
```
http://localhost:3001/script.js
```

You should see JavaScript code.

## 3. GlitchTip Configuration

### Initial Access

1. Open http://localhost:3002 in your browser
2. Create your admin account:
   - Enter email, password
   - Click "Create Account"

### Create Organization

1. After login, you'll be prompted to create an organization
2. Enter: `sbozh` (or your preferred name)
3. Click "Create Organization"

### Create Project

1. Go to Projects (sidebar)
2. Click "Create Project"
3. Select platform: `JavaScript` → `Next.js`
4. Name: `website`
5. Click "Create Project"

### Get Your DSN

1. After creation, you'll see setup instructions
2. **Copy the DSN** - it looks like:
   ```
   http://abc123...xyz@localhost:3002/1
   ```
3. You'll need this for Next.js

## 4. Next.js Integration

### Environment Variables

Create or update `apps/web/.env.local`:

```env
# Analytics - Enable/disable
NEXT_PUBLIC_ANALYTICS_ENABLED=true
NEXT_PUBLIC_FORCE_ANALYTICS=true  # Enable in development

# Umami Configuration
NEXT_PUBLIC_UMAMI_WEBSITE_ID=your-website-id-from-step-2
NEXT_PUBLIC_UMAMI_SCRIPT_URL=http://localhost:3001/script.js

# GlitchTip Configuration (optional)
NEXT_PUBLIC_GLITCHTIP_DSN=http://your-dsn@localhost:3002/1
```

### Verify Integration

The analytics providers should already be set up in the codebase:

1. **AnalyticsProvider**: `apps/web/providers/AnalyticsProvider.tsx`
2. **PerformanceProvider**: `apps/web/providers/PerformanceProvider.tsx`
3. **Analytics hooks**: `apps/web/hooks/useAnalytics.ts`
4. **Privacy controls**: `apps/web/lib/privacy/consent.ts`

### Start Development Server

```bash
# From project root
pnpm dev

# Or from apps/web
cd apps/web && pnpm dev
```

## 5. Testing the Integration

### Check Browser Console

Open http://localhost:3000 and check the console:

```javascript
// You should see:
Analytics: Umami loaded
[Web Vital] LCP: 1234 (good)
```

### Test Page Views

1. Navigate between pages in your app
2. Check Umami dashboard at http://localhost:3001
3. You should see page views appearing in real-time

### Test Custom Events

Use the analytics test page (if available) or console:

```javascript
// In browser console
window.umami.track('test_event', { label: 'manual_test' })
```

### Verify in Umami Dashboard

1. Go to http://localhost:3001
2. Select your website
3. Check:
   - Real-time visitors
   - Page views
   - Events tab

### Test Error Tracking (GlitchTip)

```javascript
// In browser console
throw new Error('Test error for GlitchTip')
```

Check http://localhost:3002 for the captured error.

## 6. Privacy Settings

### Default Consent State

By default, users have:
- Analytics: **Disabled** (opt-in required)
- Functional: **Enabled**
- Necessary: **Always enabled**

### Privacy Controls Page

Visit `/privacy` to see the consent management UI.

### Granting Consent (Development)

For testing, you can grant consent via console:

```javascript
// Grant all consent
localStorage.setItem('analytics_consent', 'granted')

// Or use the ConsentManager
import { consentManager } from '@/lib/privacy/consent'
consentManager.grantAll()
```

### Data Not Tracking?

If analytics aren't tracking, verify:
1. `NEXT_PUBLIC_ANALYTICS_ENABLED=true`
2. User has granted consent OR `NEXT_PUBLIC_FORCE_ANALYTICS=true`
3. Umami script is loaded (check Network tab)

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_ANALYTICS_ENABLED` | Yes | Enable/disable all analytics |
| `NEXT_PUBLIC_FORCE_ANALYTICS` | No | Force analytics in dev mode |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | Yes | Umami website identifier |
| `NEXT_PUBLIC_UMAMI_SCRIPT_URL` | Yes | URL to Umami tracking script |
| `NEXT_PUBLIC_GLITCHTIP_DSN` | No | GlitchTip project DSN |

## Data Retention

| Data Type | Retention | Location |
|-----------|-----------|----------|
| Analytics events | 90 days | Umami/PostgreSQL |
| Error logs | 30 days | GlitchTip/PostgreSQL |
| Performance metrics | 7 days | Browser/Umami |
| User journey | Session | sessionStorage |

Data cleanup runs automatically via client-side and server-side policies.

## Troubleshooting

### Services Won't Start

```bash
# Check logs
docker-compose logs -f

# Most common: port conflicts
lsof -i :3001  # Check what's using port 3001
lsof -i :3002  # Check what's using port 3002

# Fix: Change ports in docker-compose.yml or stop conflicting services
```

### Database Connection Errors

```bash
# Wait for PostgreSQL to be healthy
docker-compose logs postgres

# If stuck, restart with fresh volumes
docker-compose down -v
docker-compose up -d
```

### No Data in Dashboards

1. **Check browser Network tab** - Is script.js loading?
2. **Check Console** - Any errors?
3. **Verify consent** - Is analytics_consent = 'granted'?
4. **Check CSP headers** - Is Umami domain allowed?

### Content Security Policy Issues

If you see CSP errors, ensure middleware.ts allows Umami:

```typescript
// apps/web/middleware.ts
const cspHeader = `
  script-src 'self' 'unsafe-inline' http://localhost:3001;
  connect-src 'self' http://localhost:3001;
`
```

### GlitchTip Not Receiving Errors

GlitchTip may have connection issues. Umami analytics should still work. Check IMPLEMENTATION_NOTES.md for known issues.

## Maintenance

### Daily

- Monitor error rates in GlitchTip (if working)
- Check Umami for unusual traffic patterns

### Weekly

- Review analytics dashboard
- Clear resolved errors
- Check disk usage: `docker system df`

### Monthly

- Update Docker images: `docker-compose pull && docker-compose up -d`
- Review and rotate logs
- Backup databases (see README.md)

### Backup Command

```bash
# Backup all databases
docker exec analytics-postgres pg_dumpall -U analytics_admin > backup_$(date +%Y%m%d).sql
```

## Next Steps

After completing setup:

1. **Test thoroughly** - Navigate your app and verify data appears
2. **Configure alerts** - Set up GlitchTip alert rules
3. **Review privacy policy** - Update to reflect analytics usage
4. **Plan for production** - See MIGRATION.md for 0.10.0 deployment
