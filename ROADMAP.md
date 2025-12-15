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


## ~~0.6.0 - Blog Backend~~ ✅

Directus CMS integration with Docker, PostgreSQL, and repository pattern.

- ~~[0.6.0 - Directus Setup](roadmap/blog/0.6.0.md)~~
- ~~[0.6.1 - Schema Seeding](roadmap/blog/0.6.1.md)~~
- ~~[0.6.2 - Blog API Layer](roadmap/blog/0.6.2.md)~~
- ~~[0.6.3 - Frontend Integration](roadmap/blog/0.6.3.md)~~
- ~~[0.6.4 - Polish & Tests](roadmap/blog/0.6.4.md)~~

> **Note:** Filters & Drafts deferred to post-second-blog-post. Filter components exist in `@sbozh/blog` package; wiring to searchParams will be done when needed.

## ~~0.7.0 - SEO & Metadata~~ ✅

Site-wide SEO, Open Graph, structured data, and sitemap generation.

- ~~[0.7.0 - Favicon & Base Metadata](roadmap/seo/0.7.0.md)~~
- ~~[0.7.1 - Robots & Sitemap](roadmap/seo/0.7.1.md)~~
- ~~[0.7.2 - Blog Post SEO](roadmap/seo/0.7.2.md)~~
- ~~[0.7.3 - OG Image Generation](roadmap/seo/0.7.3.md)~~ 🚀 deploy to test
- ~~[0.7.4 - Page Metadata](roadmap/seo/0.7.4.md)~~
- ~~[0.7.5 - Structured Data](roadmap/seo/0.7.5.md)~~ ⏭️ skipped → backlog

## ~~0.8.0 - Projects Section~~  ✅

Projects showcase with landing pages for sbozh.me and Discord community.

- ~~[0.8.0 - Projects List Page](roadmap/projects/0.8.0.md)~~
- ~~[0.8.1 - Projects SEO](roadmap/projects/0.8.1.md)~~
- ~~[0.8.2 - Project Detail Layout](roadmap/projects/0.8.2.md)~~
- ~~[0.8.3 - sbozh.me Project](roadmap/projects/0.8.3.md)~~
- ~~[0.8.4 - Discord Community Project](roadmap/projects/0.8.4.md)~~
- ~~[0.8.5 - Polish & Testing](roadmap/projects/0.8.5.md)~~

## ~~0.9.0 - Analytics & Error Tracking~~ ✅

Self-hosted analytics (Umami) and error tracking (GlitchTip) with privacy-first approach.

- ~~[0.9.0 - Analytics Infrastructure Setup](roadmap/analytics/0.9.0.md)~~ - Docker setup for local development
- ~~[0.9.1 - Umami Analytics Integration](roadmap/analytics/0.9.1.md)~~ - Page views and custom events
- ~~[0.9.2 - GlitchTip Error Tracking](roadmap/analytics/0.9.2.md)~~ - Web Vitals and consent management
- ~~[0.9.3 - Advanced Tracking & Privacy](roadmap/analytics/0.9.3.md)~~ - E2E tests and migration guide

> **Tech Stack:** Umami (analytics), GlitchTip (errors), PostgreSQL, Redis, Docker Compose
> **Note:** Production deployment (Hetzner VPS) will be handled in 0.11.0

> 0.9.2 is containing 0.9.3

## ~~0.10.0 - Legal & Cosmetic fixes~~ ✅

Legal pages with cookie consent, privacy policy, and terms of usage.

- ~~[0.10.0 - Cookie Consent Modal](roadmap/legal/0.10.0.md)~~ - Floating consent modal for first-time visitors
- ~~[0.10.1 - Terms of Usage](roadmap/legal/0.10.1.md)~~ - Terms page with footer link
- ~~[0.10.2 - Privacy Controls Styling](roadmap/legal/0.10.2.md)~~ - Updated controls to match modal design
- ~~0.10.3 - Cosmetic fixes~~

## 0.11.0 - Deployment

Hetzner production deployment with CI/CD, GitOps, and backup automation.

- ~~[0.11.0 - Terraform Validation](roadmap/deploy/0.11.0.md)~~ - Validate Hetzner IaC
- ~~[0.11.1 - Dockerfile & CI/CD](roadmap/deploy/0.11.1.md)~~ - Next.js image + GitHub Actions
- ~~[0.11.2 - GitOps](roadmap/deploy/0.11.2.md)~~ - Deploy manifest workflow
- ~~[0.11.3 - Analytics Integration](roadmap/deploy/0.11.3.md)~~ - Umami in docker-compose
- ~~[0.11.4 - Nginx Subdomains](roadmap/deploy/0.11.4.md)~~ - analytics + directus SSL
- ~~[0.11.5 - Environment Configuration](roadmap/deploy/0.11.5.md)~~ - .env.local for domains
- ~~[0.11.6 - Local Backup Script](roadmap/deploy/0.11.6.md)~~ - Download backups to dev machine
- ~~0.11.7 - Step by step instruction~~
- 0.11.8 - Acceptable working state on prod

> **Tech Stack:** Terraform, Docker, GitHub Actions, GHCR, Nginx, Certbot, Umami

## 1.0.0 - Release

- Production launch
- Final QA
- Public announcement
- Test 0.7.3

---
