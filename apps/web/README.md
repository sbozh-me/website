# @sbozh/web

Next.js frontend for sbozh.me personal website.

**Version**: 0.8.5 | **Framework**: Next.js 15.5.7 | **License**: MIT

## Features

- **Projects Section**: Showcase with tabbed navigation (About, Motivation, Roadmap, Changelog)
- **Blog System**: Directus CMS integration with MDX rendering
- **CV Page**: Custom markdown parser with PDF export
- **Contact Page**: Email and social links
- **Accessibility**: Full ARIA support, keyboard navigation
- **Testing**: 90%+ coverage with Vitest
- **SEO**: OpenGraph, sitemap, structured data

## Development

```bash
# From repository root
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build
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

## Error Handling

When Directus is unavailable or returns errors (e.g., invalid credentials), the blog pages display a user-friendly error state instead of crashing:

- **Blog list page**: Shows error message with status code
- **Blog post page**: Shows error message with status code
- **Static generation**: Falls back to dynamic rendering if Directus is unreachable

Common errors:
- `Invalid user credentials` - Check `DIRECTUS_TOKEN` is correct
- Connection refused - Ensure Directus is running (`docker compose up -d`)

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

## Caching

Both Directus and Next.js have caching layers that can cause stale data during development.

### Directus Caching

Directus caching is **disabled by default** in `docker-compose.yaml`:

```yaml
CACHE_ENABLED: "false"
CACHE_AUTO_PURGE: "true"
```

To enable caching for production, set `CACHE_ENABLED: "true"`.

### Next.js Caching

Blog pages use `dynamic = "force-dynamic"` and `noStore()` to disable Next.js caching. The Directus SDK is also configured with `cache: "no-store"` for all requests.

If content still appears stale:
1. Clear Next.js cache: `rm -rf apps/web/.next`
2. Restart Directus: `cd apps/web/directus && docker compose restart`
3. Restart dev server: `pnpm dev`

## SEO

### Robots & Sitemap

The site generates `robots.txt` and `sitemap.xml` at build time using Next.js metadata conventions.

**Files:**
- `app/robots.ts` - Generates `/robots.txt`
- `app/sitemap.ts` - Generates `/sitemap.xml`

**Indexed pages:**
- `/` (homepage)
- `/blog` (blog list)
- `/blog/[slug]` (individual posts)
- `/projects` (projects showcase)
- `/projects/[slug]` (project detail pages)
- `/contact` (contact page)

**Excluded from indexing:**
- `/cv` (resume page)

**Sitemap regeneration:**
The sitemap is generated during `pnpm build`. To regenerate after publishing new blog posts, trigger a rebuild via Directus Flow webhook or manual deploy.
