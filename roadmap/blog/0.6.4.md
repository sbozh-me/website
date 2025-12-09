# 0.6.4 - Filters & Drafts

## Goal

Implement all filters and draft preview functionality with Directus session authentication.

## Deliverables

- [ ] Persona filter working
- [ ] Tag filter working (M2M query)
- [ ] Year filter working
- [ ] Draft posts hidden by default
- [ ] `?draft=true` shows drafts for authenticated Directus users
- [ ] Directus session validation helper

## Filter Implementation

The DirectusRepository from 0.6.2 already supports filters. This step ensures they work end-to-end.

### Persona Filter

```typescript
// Directus query
filter: { persona: { slug: { _eq: 'founder' } } }
```

### Tag Filter (M2M)

```typescript
// Directus query for M2M relation
filter: { tags: { tags_id: { slug: { _eq: 'tech' } } } }
```

### Year Filter

```typescript
// Directus query for date range
filter: {
  date_published: {
    _gte: '2025-01-01',
    _lt: '2026-01-01',
  }
}
```

## Draft Preview System

### Session Validation Helper

```typescript
// apps/web/lib/blog/session.ts
import { cookies } from 'next/headers';

export async function validateDirectusSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('directus_session_token');

  if (!sessionToken) {
    return false;
  }

  // Validate session with Directus
  try {
    const response = await fetch(`${process.env.DIRECTUS_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${sessionToken.value}`,
      },
    });

    return response.ok;
  } catch {
    return false;
  }
}
```

### Blog Page with Draft Support

```typescript
// apps/web/app/(main)/blog/page.tsx
import { createBlogRepository } from '@/lib/blog/repository';
import { validateDirectusSession } from '@/lib/blog/session';

interface PageProps {
  searchParams: Promise<{ draft?: string; persona?: string; tag?: string; year?: string }>;
}

export default async function BlogPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const showDrafts = params.draft === 'true';

  // Validate session for draft preview
  let includeDrafts = false;
  if (showDrafts) {
    includeDrafts = await validateDirectusSession();
  }

  const repository = createBlogRepository({ includeDrafts });

  const filters = {
    persona: params.persona,
    tag: params.tag,
    year: params.year ? parseInt(params.year) : undefined,
  };

  const [posts, personas, tags] = await Promise.all([
    repository.getPosts(filters),
    repository.getPersonas(),
    repository.getTags(),
  ]);

  // ... render with draft indicator if includeDrafts
}
```

### Blog Post Page with Draft Support

```typescript
// apps/web/app/(main)/blog/[slug]/page.tsx
import { createBlogRepository } from '@/lib/blog/repository';
import { validateDirectusSession } from '@/lib/blog/session';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ draft?: string }>;
}

export default async function BlogPostPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { draft } = await searchParams;

  let includeDrafts = false;
  if (draft === 'true') {
    includeDrafts = await validateDirectusSession();
  }

  const repository = createBlogRepository({ includeDrafts });
  const post = await repository.getPost(slug);

  if (!post) {
    notFound();
  }

  // Optionally show draft banner
  const isDraft = post.status === 'draft';

  return (
    <>
      {isDraft && includeDrafts && (
        <div className="bg-yellow-500/10 border border-yellow-500 p-4 mb-4 rounded">
          This is a draft post. It is not visible to the public.
        </div>
      )}
      {/* ... rest of page */}
    </>
  );
}
```

## Directus CORS Configuration

Ensure Directus allows credentials from Next.js:

```yaml
# docker-compose.yaml
environment:
  CORS_ENABLED: true
  CORS_ORIGIN: http://localhost:3000
  CORS_CREDENTIALS: true
```

## URL Examples

- `/blog` - All published posts
- `/blog?persona=founder` - Published posts by The Founder
- `/blog?tag=tech` - Published posts with Tech tag
- `/blog?year=2025` - Published posts from 2025
- `/blog?draft=true` - All posts including drafts (if authenticated)
- `/blog/my-post?draft=true` - View draft post (if authenticated)

## Acceptance Criteria

- [ ] `/blog?persona=founder` returns only founder's posts
- [ ] `/blog?tag=tech` returns only posts with tech tag
- [ ] `/blog?year=2025` returns only 2025 posts
- [ ] Draft posts NOT shown on normal `/blog`
- [ ] `?draft=true` without session shows only published
- [ ] `?draft=true` with valid Directus session shows drafts
- [ ] Draft banner displayed on draft post pages
- [ ] Session validation is secure (server-side only)
- [ ] Filters can be combined (e.g., `?persona=founder&year=2025`)
