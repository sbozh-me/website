# Blog System Module

> **Role**: Content management and rendering system
> **Package**: `@sbozh/blog`
> **Status**: Production
> **Critical Path**: Yes - Powers /blog routes

## Overview

The blog system is a full-featured content platform with:
- **Abstract data layer** (repository pattern)
- **Directus CMS backend** (production)
- **Mock repository** (development/testing)
- **MDX rendering** with syntax highlighting
- **Multi-persona** support (different writing styles)
- **Timeline UI** with year/month grouping
- **Tag and date filtering**

## Architecture

```
User Request → Blog Page
    ↓
BlogRepository (abstraction)
    ├→ DirectusRepository (production)
    │   └→ Directus API → PostgreSQL
    └→ MockRepository (dev/test)
        └→ Static fixtures

Posts → MDX Processing
    ├→ rehype-pretty-code (syntax highlighting)
    └→ rehype-slug (heading IDs)
        ↓
Timeline Component → Rendered Page
```

## Key Files

| File | Purpose | Location |
|------|---------|----------|
| `repository.ts` | Data abstraction layer | `packages/blog/src/data/repository.ts` |
| `directus-repository.ts` | Directus API client | `packages/blog/src/data/directus-repository.ts` |
| `mock-repository.ts` | Test/dev data source | `packages/blog/src/data/mock-repository.ts` |
| `Timeline.tsx` | Main UI component | `packages/blog/src/components/timeline/Timeline.tsx` |
| `page.tsx` | Blog index page | `apps/web/app/(main)/blog/page.tsx` |
| `[slug]/page.tsx` | Individual post | `apps/web/app/(main)/blog/[slug]/page.tsx` |

## Data Flow

### Fetching Posts

```typescript
// 1. Create repository (abstracts data source)
const repository = createBlogRepository();

// 2. Fetch posts
const posts = await repository.getPosts();
// Returns: PostListItem[] with metadata

// 3. Get single post
const post = await repository.getPostBySlug(slug);
// Returns: Full Post with MDX content
```

### Repository Pattern

**Interface:**
```typescript
interface BlogRepository {
  getPosts(): Promise<PostListItem[]>;
  getPostBySlug(slug: string): Promise<Post>;
}
```

**Implementations:**
- `DirectusRepository`: Production CMS
- `MockRepository`: Dev/test with static data

### MDX Processing

```typescript
// 1. Get post content (MDX string)
const post = await repository.getPostBySlug(slug);

// 2. Process with MDX
const { default: MDXContent } = await evaluate(post.content, {
  rehypePlugins: [
    rehypeSlug,           // Add IDs to headings
    rehypePrettyCode      // Syntax highlighting
  ]
});

// 3. Render
<MDXContent />
```

## Components

### Timeline (`Timeline.tsx`)
Groups posts by year and month, shows metadata.

```tsx
<Timeline
  posts={posts}           // PostListItem[]
  title="Blog Posts"
  emptyMessage="No posts yet"
/>
```

### Post Header (`PostHeader.tsx`)
Shows post metadata, author persona, reading time.

```tsx
<PostHeader
  title={post.title}
  date={post.date}
  readingTime={post.readingTime}
  persona={post.persona}
  tags={post.tags}
/>
```

### Filters (`Filters.tsx`)
Date range, tag, and persona filtering.

```tsx
const { filteredPosts } = usePostFilters({
  posts,
  initialFilters: { persona: null, tags: [], dateRange: null }
});
```

## Personas

**Supported personas:**
- **Technical**: Deep technical content
- **Builder**: Maker-focused content
- **Personal**: Life/reflection posts

Each post has a persona that affects styling and categorization.

## Environment

### Production
```bash
DIRECTUS_URL=https://directus.sbozh.me
DIRECTUS_TOKEN=[secure-token]
```

### Development/Test
No env vars needed - uses MockRepository automatically.

## Common Operations

### Add New Post (Directus)
1. Log into Directus CMS at directus.sbozh.me
2. Navigate to `posts` collection
3. Create new item with required fields:
   - title, slug, excerpt, content (MDX)
   - date_published, persona, tags
4. Publish status: `published`
5. Post appears automatically

### Add Test Fixture
Edit `packages/blog/src/data/mock-data.ts`:
```typescript
export const mockPosts: Post[] = [
  {
    id: "new-post",
    title: "New Post",
    slug: "new-post",
    content: "# Hello\n\nContent here",
    // ... other fields
  }
];
```

### Modify MDX Processing
Edit `apps/web/app/(main)/blog/[slug]/page.tsx`:
```typescript
const { default: MDXContent } = await evaluate(post.content, {
  rehypePlugins: [
    // Add new plugins here
  ]
});
```

## Testing

```bash
# Run blog package tests
pnpm test --filter=@sbozh/blog

# Test coverage
pnpm test:coverage --filter=@sbozh/blog
```

## Troubleshooting

### "Failed to fetch posts"
- Check `DIRECTUS_URL` and `DIRECTUS_TOKEN` env vars
- Verify Directus is accessible
- Falls back to MockRepository if Directus fails

### "Post not found"
- Check slug matches exactly (case-sensitive)
- Verify post status is `published` in Directus
- Check `date_published` is not in future

### MDX Rendering Error
- Validate MDX syntax in Directus
- Check for unsupported MDX features
- Review error in browser console

## Related Documentation

- Integration: `integrations/directus.md`
- UI Components: `modules/ui-components.md`
- Deployment: `systems/cms.md`

---

**Last Updated:** 2026-01-02