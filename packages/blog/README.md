# @sbozh/blog

Blog UI package with abstract data layer using the repository pattern.

## Features

- **Timeline Layout** - Posts grouped by year and month with persona indicators
- **Filtering** - Filter by persona, tags, and date with URL state persistence
- **MDX Rendering** - Full MDX support with syntax highlighting
- **Table of Contents** - Sticky TOC with active section tracking
- **Responsive Design** - Mobile-first with desktop enhancements
- **Repository Pattern** - Abstract interface for easy backend swapping
- **SEO Ready** - OpenGraph tags, static generation, metadata

## Installation

```bash
pnpm add @sbozh/blog
```

## Core Concepts

### Multi-Persona Blog

The blog supports multiple personas (authors/voices):
- **The Founder** - Business and startup content
- **Kagurame Sbozh** - Creative writing and storytelling
- **Semenus** - Philosophy and deeper thoughts

Each persona has a unique color and visual indicator throughout the UI.

### Repository Pattern

The package uses an abstract `BlogRepository` interface, allowing you to swap data sources without changing UI code:

```typescript
interface BlogRepository {
  getPosts(filters?: PostFilters): Promise<PostListItem[]>;
  getPost(slug: string): Promise<Post | null>;
  getPersonas(): Promise<Persona[]>;
  getTags(): Promise<Tag[]>;
}
```

**Implementations:**
- `MockBlogRepository` - In-memory mock data for development
- `DirectusRepository` - Directus CMS integration via REST API

## Usage

### DirectusRepository (Production)

```typescript
import { DirectusRepository } from '@sbozh/blog/data';

const repository = new DirectusRepository({
  url: process.env.DIRECTUS_URL,      // e.g. 'http://localhost:8055'
  token: process.env.DIRECTUS_TOKEN,  // Optional: static API token
  includeDrafts: false,               // Optional: show draft posts
  assetBaseUrl: '/api/assets',        // Optional: custom asset URL for proxying
  debug: false,                       // Optional: enable debug logging
});

const posts = await repository.getPosts({ persona: 'founder' });
```

#### Debug Logging

Enable debug logging to see API requests and responses:

```typescript
const repository = new DirectusRepository({
  url: process.env.DIRECTUS_URL,
  token: process.env.DIRECTUS_TOKEN,
  debug: true,  // Enable debug logging
});
```

This will output logs like:
```
[DirectusRepository.getPosts] Fetching posts with filter: { "status": { "_eq": "published" } }
[DirectusRepository.getPosts] Fetched 5 posts
```

### Error Handling

The `DirectusRepository` wraps all API errors in `DirectusError` for consistent error handling:

```typescript
import { DirectusRepository, DirectusError } from '@sbozh/blog/data';
import { ErrorState } from '@sbozh/blog/components';

export default async function BlogPage() {
  const repository = new DirectusRepository({ url, token });

  let posts;
  let error: DirectusError | null = null;

  try {
    posts = await repository.getPosts();
  } catch (e) {
    error = DirectusError.fromError(e);
  }

  if (error) {
    return (
      <ErrorState
        title="Unable to load posts"
        message={error.message}
        status={error.status}
      />
    );
  }

  return <Timeline posts={posts} />;
}
```

The `DirectusError` class provides:
- `message` - Human-readable error message
- `status` - HTTP status code (when available)
- `DirectusError.fromError(e)` - Static method to convert any error

### MockBlogRepository (Development)

```typescript
import { MockBlogRepository } from '@sbozh/blog/data';
import { Timeline, FilterBar } from '@sbozh/blog/components';

export default async function BlogPage() {
  const repository = new MockBlogRepository();
  const [posts, personas, tags] = await Promise.all([
    repository.getPosts(),
    repository.getPersonas(),
    repository.getTags(),
  ]);

  return (
    <>
      <FilterBar
        personas={personas}
        tags={tags}
        filters={filters}
        onFiltersChange={handleFilterChange}
      />
      <Timeline posts={posts} />
    </>
  );
}
```

### Blog Post Page

```typescript
import { evaluate } from '@mdx-js/mdx';
import * as runtime from 'react/jsx-runtime';
import rehypePrettyCode from 'rehype-pretty-code';
import rehypeSlug from 'rehype-slug';
import {
  PostHeader,
  PostLayout,
  TableOfContents,
} from '@sbozh/blog/components';
import { MockBlogRepository } from '@sbozh/blog/data';
import { extractHeadings } from '@sbozh/blog/utils';
import '@sbozh/blog/styles/prose.css';
import '@sbozh/blog/styles/code.css';

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const repository = new MockBlogRepository();
  const post = await repository.getPost(slug);

  if (!post) notFound();

  // Extract TOC from raw markdown
  const toc = extractHeadings(post.content);

  // Compile MDX
  const { default: MDXContent } = await evaluate(post.content, {
    ...runtime,
    rehypePlugins: [
      rehypeSlug,
      [rehypePrettyCode, { theme: 'github-dark' }],
    ],
  });

  return (
    <PostLayout toc={toc}>
      <PostHeader post={post} />
      <div className="prose">
        <MDXContent />
      </div>
    </PostLayout>
  );
}
```

## Components

### Timeline Components

- `Timeline` - Container for year/month grouped posts
- `YearMarker` - Year divider with border
- `MonthMarker` - Month label
- `PostCard` - Individual post preview with persona dot, date, excerpt
- `PersonaDot` - Colored indicator for persona
- `EmptyState` - No results message
- `ErrorState` - Error display with status code

### Filter Components

- `FilterBar` - Container for all filters
- `DateFilter` - Year/month dropdown
- `TagFilter` - Tag dropdown
- `PersonaFilter` - Persona dropdown with colored indicators
- `SearchPlaceholder` - Placeholder for future Algolia integration

### Post Components

- `PostLayout` - Two-column layout with content + TOC sidebar
- `PostHeader` - Persona, title, date, reading time, tags
- `TableOfContents` - Sticky TOC with IntersectionObserver tracking
- `ScrollToTop` - Floating scroll-to-top button

## Styling

The package includes CSS files that should be imported:

```typescript
import '@sbozh/blog/styles/prose.css';      // Article typography
import '@sbozh/blog/styles/code.css';       // Syntax highlighting
import '@sbozh/blog/styles/toc.css';        // Table of contents
import '@sbozh/blog/styles/scroll-to-top.css'; // Scroll button
```

### Typography

- **Base**: 18px font-size, 1.8 line-height for comfortable reading
- **Headings**: Clear hierarchy with proper spacing
- **Links**: Purple (primary color) with underline
- **Blockquotes**: Left border in primary color

### Code Blocks

Syntax highlighting uses the **Forge theme** matching the Obsidian Forge design system:
- Keywords: Purple (#8b5cf6)
- Strings: Green (#22c55e)
- Functions: Gold (#f59e0b)
- Comments: Muted (#6b7280)

## Data Types

### Post

```typescript
interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;      // MDX content
  date: string;         // ISO date
  readingTime: number;  // minutes
  persona: Persona;
  tags: Tag[];
  image?: PostImage;    // Optional hero image
}
```

### Persona

```typescript
interface Persona {
  id: string;
  name: string;         // "The Founder", "Semenus", etc.
  slug: string;         // "founder", "semenus", etc.
  color: string;        // hex color, e.g. "#8b5cf6"
  description?: string;
}
```

### Tag

```typescript
interface Tag {
  id: string;
  name: string;
  slug: string;
}
```

## Utilities

### Date Formatting

```typescript
import {
  formatDate,
  formatShortDate,
  formatReadingTime,
  groupPostsByDate,
} from '@sbozh/blog/utils';

formatDate('2025-12-09');           // "December 9, 2025"
formatShortDate('2025-12-09');      // "Dec 9, 2025"
formatReadingTime(5);               // "5 min read"
groupPostsByDate(posts);            // Group by year/month
```

### TOC Extraction

```typescript
import { extractHeadings } from '@sbozh/blog/utils';

const toc = extractHeadings(markdownContent);
// Returns: [{ id: 'heading-slug', text: 'Heading Text', level: 2 }, ...]
```

## Hooks

### usePostFilters

```typescript
import { usePostFilters } from '@sbozh/blog/hooks';

function BlogPage() {
  const { filters, setFilter, clearFilters, hasActiveFilters } =
    usePostFilters();

  return (
    <FilterBar
      filters={filters}
      onFiltersChange={(key, value) => setFilter(key, value)}
    />
  );
}
```

## Mobile Behavior

- **Timeline**: Full-width cards on mobile
- **Filters**: Stacked layout on mobile, inline on desktop
- **TOC**: Displayed inline under hero image on mobile, sticky sidebar on desktop
- **Active states**: Disabled on mobile for TOC (no IntersectionObserver)

## Testing

```bash
pnpm test              # Run tests
pnpm test:watch        # Watch mode
pnpm test:coverage     # Generate coverage report
```

### Integration Tests

Integration tests require a running Directus instance:

```bash
# Start Directus locally
cd apps/web/directus
docker compose up -d

# Run all tests including integration
DIRECTUS_URL=http://localhost:8055 DIRECTUS_TOKEN=your-token pnpm test
```

Integration tests are automatically skipped when `DIRECTUS_URL` is not set.

Target: 90%+ coverage

## Roadmap

- ~~**v0.6.0** - Directus CMS integration~~ ✅
- **v0.7.0** - SEO optimization (OG tags, sitemap)
- **v0.8.0** - Projects page
- **v0.9.0** - Newsletter subscription
- **v1.0.0** - Production release

## Dependencies

- `@directus/sdk` - Directus CMS client
- `@mdx-js/mdx` - MDX compilation
- `rehype-pretty-code` - Syntax highlighting
- `rehype-slug` - Heading IDs
- `github-slugger` - Slug generation
- `shiki` - Code tokenization

## License

Private - Part of @sbozh/website monorepo
