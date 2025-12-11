# Web App

Next.js frontend for sbozh.me personal website.

## Development

```bash
# From repository root
pnpm dev
```

## Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

| Variable | Description |
|----------|-------------|
| `DIRECTUS_URL` | Directus API URL (e.g., `http://localhost:8055`) |
| `DIRECTUS_TOKEN` | Static API token for Directus authentication |

Without these variables, the app falls back to mock data.

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
