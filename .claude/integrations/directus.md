# Directus CMS Integration

> **Service**: Directus Headless CMS
> **Purpose**: Blog content management
> **URL**: https://directus.sbozh.me
> **Status**: Production
> **Critical**: Yes - Blog depends on this

## Overview

Directus provides the headless CMS backend for blog content:
- **PostgreSQL database** for content storage
- **REST API** for content delivery
- **Admin UI** for content management
- **Collections**: posts, personas, tags
- **Self-hosted** on Hetzner VPS

## Architecture

```
Admin UI (directus.sbozh.me)
    ↓
Directus Server
    ↓
PostgreSQL Database
    ↓
REST API (/items/posts)
    ↓
DirectusRepository (apps/web)
    ↓
Blog Pages
```

## API Endpoints

### Get All Posts
```bash
GET https://directus.sbozh.me/items/posts
  ?filter[status][_eq]=published
  &sort=-date_published
  &fields=id,title,slug,excerpt,date_published,persona.*,tags.*
```

### Get Single Post
```bash
GET https://directus.sbozh.me/items/posts
  ?filter[slug][_eq]=my-post-slug
  &filter[status][_eq]=published
  &fields=*,persona.*,tags.*
```

### Health Check
```bash
GET https://directus.sbozh.me/server/health
# → {"status":"ok"}
```

## Collections

### Posts
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | Auto | Primary key |
| title | String | Yes | Post title |
| slug | String | Yes | URL slug (unique) |
| excerpt | Text | Yes | Short description |
| content | Text | Yes | MDX content |
| date_published | DateTime | Yes | Publish date |
| date_updated | DateTime | Auto | Last modified |
| status | String | Yes | draft/published |
| persona | M2O | Yes | Link to personas |
| tags | M2M | No | Link to tags |
| image | File | No | Featured image |

### Personas
| Field | Type | Notes |
|-------|------|-------|
| id | String | technical/builder/personal |
| name | String | Display name |
| description | Text | Persona description |
| color | String | Theme color |

### Tags
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Auto |
| name | String | Tag name |
| slug | String | URL slug |

## Authentication

### Environment Variables
```bash
DIRECTUS_URL=https://directus.sbozh.me
DIRECTUS_TOKEN=[static-token]
```

Token is a **static token** created in Directus admin for server-to-server auth.

### Creating Token
1. Log into Directus admin
2. Settings → Access Tokens
3. Create new static token
4. Copy token to env vars

## Data Flow

### Fetching Posts (DirectusRepository)

```typescript
// 1. Initialize client
const client = createDirectus(DIRECTUS_URL)
  .with(rest())
  .with(staticToken(DIRECTUS_TOKEN));

// 2. Query posts
const response = await client.request(
  readItems("posts", {
    filter: { status: { _eq: "published" } },
    sort: ["-date_published"],
    fields: ["*", "persona.*", "tags.*"]
  })
);

// 3. Transform to app format
const posts = response.map(transformDirectusPost);
```

### Content Transformation

Directus → App Format:
```typescript
// Directus format
{
  id: "uuid",
  title: "Post Title",
  date_published: "2026-01-02T12:00:00Z",
  persona: { id: "technical", name: "Technical" },
  tags: [{ tags_id: { name: "TypeScript" } }]
}

// App format
{
  id: "uuid",
  title: "Post Title",
  date: "2026-01-02T12:00:00Z",
  persona: { id: "technical", name: "Technical" },
  tags: [{ name: "TypeScript", slug: "typescript" }]
}
```

## Common Operations

### Add New Blog Post
1. Log into https://directus.sbozh.me
2. Navigate to Posts collection
3. Click "Create Item"
4. Fill required fields:
   - Title, Slug, Excerpt
   - Content (MDX format)
   - Date Published
   - Persona
   - Tags (optional)
5. Set Status: `published`
6. Save

Post appears on blog immediately.

### Update Existing Post
1. Find post in Posts collection
2. Edit fields
3. `date_updated` updates automatically
4. Save

Changes reflect immediately (no cache).

### Manage Personas
1. Navigate to Personas collection
2. Edit existing or create new
3. Choose unique ID (lowercase, no spaces)
4. Set name, description, color
5. Save

### Manage Tags
1. Navigate to Tags collection
2. Create new tag with name
3. Slug auto-generates from name
4. Save

## Error Handling

### DirectusRepository Behavior

```typescript
try {
  const posts = await repository.getPosts();
} catch (error) {
  if (error instanceof DirectusError) {
    // Directus-specific error
    console.error("CMS error:", error.message);
    // Falls back to empty array or throws
  }
}
```

### Graceful Degradation

If Directus is unavailable:
- Development: Falls back to `MockRepository`
- Production: Shows error state on blog page
- Rest of site continues working

## Monitoring

### Health Check
```bash
curl https://directus.sbozh.me/server/health
```

### Logs
Production logs available via:
```bash
ssh hetzner
docker logs directus-server
```

### Common Issues

**"Failed to fetch posts"**
- Check Directus is running: `curl https://directus.sbozh.me/server/health`
- Verify `DIRECTUS_TOKEN` is valid
- Check PostgreSQL is up

**"Post not found"**
- Verify slug matches exactly
- Check status is `published`
- Ensure `date_published` is not in future

**"Unauthorized"**
- Regenerate static token
- Update `DIRECTUS_TOKEN` env var
- Restart web app

## Database

### PostgreSQL Connection
Managed by Directus, not directly accessed by web app.

### Backups
Automated backups via Hetzner deployment:
```bash
make backup-cms  # Manual backup trigger
```

## Related Documentation

- Module: `modules/blog.md`
- System: `systems/cms.md`
- Deployment: `systems/production.md`

---

**Last Updated:** 2026-01-02