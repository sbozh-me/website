# Roadmap

## ~~0.2.0 - App Structure~~ ✅

- ~~Home page with navigation menu~~
- ~~Social links (LinkedIn, Discord, Email)~~
- ~~Footer with website stack info~~
- ~~Blog page (placeholder)~~
- ~~CV page (placeholder)~~

## ~~0.3.0 - Obsidian Forge Design~~ ✅

- ~~Obsidian Forge color palette (amethyst, gold, terminal green)~~
- ~~Space Grotesk + JetBrains Mono typography~~
- ~~Generous spacing and responsive layouts~~
- ~~Motion design (staggered reveals, hover animations)~~
- ~~SparkMark component with shimmer animation~~
- ~~Responsive hamburger menu~~

## ~~0.4.0 - CV Page (PMDXJS)~~ ✅

Full CV page powered by `@sbozh/pmdxjs` - a custom markdown-to-JSX parser.

- ~~[0.4.0 - Package Scaffold + Parser](roadmap/pmdxjs/0.4.0.md)~~
- ~~[0.4.1 - Core Layout Components](roadmap/pmdxjs/0.4.1.md)~~
- ~~[0.4.2 - CV-Specific Components](roadmap/pmdxjs/0.4.2.md)~~
- ~~[0.4.3 - MDX Browser Runtime](roadmap/pmdxjs/0.4.3.md)~~
- ~~[0.4.4 - CV Page Implementation](roadmap/pmdxjs/0.4.4.md)~~
- ~~[0.4.5 - PDF Export](roadmap/pmdxjs/0.4.5.md)~~

## ~~0.5.0 - Blog Layouts~~ ✅

Blog UI powered by `@sbozh/blog` package with abstract data layer (repository pattern).

- ~~[0.5.0 - Package Scaffold + Types + Data Layer](roadmap/blog/0.5.0.md)~~
- ~~[0.5.1 - Timeline Components](roadmap/blog/0.5.1.md)~~
- ~~[0.5.2 - Filter Components](roadmap/blog/0.5.2.md)~~
- ~~[0.5.3 - Post Page Components](roadmap/blog/0.5.3.md)~~
- ~~[0.5.4 - Blog List Page Implementation](roadmap/blog/0.5.4.md)~~
- ~~[0.5.5 - Post Page Implementation](roadmap/blog/0.5.5.md)~~

0.5.4 and 0.5.5 was ignore because demos was implemented in 0.5.3


## 0.6.0 - Blog Backend

Directus CMS integration with Docker, PostgreSQL, and repository pattern.

- [0.6.0 - Directus Setup](roadmap/blog/0.6.0.md)
- [0.6.1 - Schema Seeding](roadmap/blog/0.6.1.md)
- [0.6.2 - Blog API Layer](roadmap/blog/0.6.2.md)
- [0.6.3 - Frontend Integration](roadmap/blog/0.6.3.md)
- [0.6.4 - Polish & Tests](roadmap/blog/0.6.4.md)

> **Note:** Filters & Drafts deferred to post-second-blog-post. Filter components exist in `@sbozh/blog` package; wiring to searchParams will be done when needed.

## 0.7.0 - Blog SEO

- SEO preparation for LinkedIn announcements
- Open Graph meta tags
- Social sharing optimization

## 0.8.0 - Projects Page

- Projects listing
- Blog engine boilerplate announcement
- CV builder announcement

## 0.9.0 - Updates subscribe

- Enter email to subscribe to updates
- CV updates
- Blog updates
- Project updates

## 0.10.0 - Deployment

- Hetzner deploy scripts
- CI/CD pipeline
- Production configuration

## 0.11.0 - Analytics

- Tracking systems integration
- Analytics dashboard

## 0.12.0 - Legal

- Cookie consent
- Privacy policy
- Coincidences disclaimer

## 1.0.0 - Release

- Production launch
- Final QA
- Public announcement

---

## Post-Release

### Wide Text Search

- PostgreSQL full-text search or Algolia integration
- `search` parameter in PostFilters
- May require Directus extensions
