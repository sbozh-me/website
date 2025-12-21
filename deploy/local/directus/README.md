# Directus CMS

Local Directus instance for blog content management.

## Quick Start

```bash
# Start services
docker compose up -d

# First time setup (applies schema + seeds data)
./setup-schema.sh
```

## Access

- **Admin Panel**: http://localhost:8055
- **Email**: `admin@sbozh.me`
- **Password**: `directus123`

## Commands

```bash
# Start
docker compose up -d

# Stop
docker compose down

# View logs
docker compose logs -f directus

# Reset everything
docker compose down -v
rm -rf data/
docker compose up -d
./setup-schema.sh
```

## Schema

| Collection | Description |
|------------|-------------|
| `personas` | Blog author personas (Founder, Kagurame, Semenus) |
| `tags` | Post categories (Tech, Startup, Philosophy, etc.) |
| `posts` | Blog posts with MDX content |
| `posts_tags` | Junction table for M2M relation |

## Files

| File | Purpose |
|------|---------|
| `docker-compose.yaml` | PostgreSQL + Redis + Directus services |
| `setup-schema.sh` | Apply schema and seed data |
| `seed-data.sh` | Import seed data only |
| `snapshots/blog-schema.yaml` | Schema definition (version controlled) |
| `snapshots/seed-data.json` | Initial data |

## Export Schema Changes

After modifying schema in Directus UI:

```bash
docker compose exec directus npx directus schema snapshot /directus/snapshots/blog-schema.yaml
docker compose cp directus:/directus/snapshots/blog-schema.yaml ./snapshots/
```
