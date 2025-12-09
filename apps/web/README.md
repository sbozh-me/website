# Web App

Next.js frontend for sbozh.me personal website.

## Development

```bash
# From repository root
pnpm dev
```

## Directus CMS

Local Directus instance for blog content management.

### Start Directus

```bash
cd apps/web/directus
docker compose up -d
```

### Access Admin Panel

- URL: http://localhost:8055
- Email: See `directus/.env` (ADMIN_EMAIL)
- Password: See `directus/.env` (ADMIN_PASSWORD)

### Stop Directus

```bash
cd apps/web/directus
docker compose down
```

### Reset Data

```bash
cd apps/web/directus
docker compose down -v
rm -rf data/
docker compose up -d
```
