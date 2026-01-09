# Release Notes

> **Location**: `packages/release-notes/`
> **Status**: Production (load more button pending)

CMS-driven announcement system. Users see "what shipped" without navigating hardcoded changelog/roadmap tabs.

## Key Files

**Components** (`src/components/`):
- `ReleaseTimeline.tsx` - Main container, receives releases + pre-compiled MDX
- `ReleaseTimelineEntry.tsx` - Individual entry (border-based timeline design)
- `ReleaseMediaCard.tsx` - Media attachments (images/videos)
- `ErrorState.tsx` - Error display

**Data** (`src/data/`):
- `directus-repository.ts` - DirectusRepository with DirectusError class
- `repository.ts` - Abstract interface

**Types** (`src/types/`):
- `release.ts` - Release, ReleaseListItem, ReleaseMedia
- `project.ts` - ProjectRef (links to projects collection)
- `filters.ts` - ReleaseFilters (project slug, limit)

**Utils** (`src/utils/`):
- `date-format.ts` - formatReleaseDate(), getRelativeTime()

## Data Flow

1. `apps/web/app/page.tsx` calls `repository.getReleases({ limit: 3 })`
2. DirectusRepository fetches from `release_notes` collection
3. Page compiles MDX summaries in parallel using `@mdx-js/mdx evaluate()`
4. Pre-rendered summaries passed to ReleaseTimeline component

## Directus Collections

- `release_notes` - id, version, title, summary (MDX), date_released, project (M2O), media (file)
- `projects` - id, name, slug (referenced by release_notes)

## Design Decisions

- **Border-based timeline**: Circle sits on left border, border acts as vertical timeline line
- **MDX compiled server-side**: Summaries rendered in page.tsx, passed pre-compiled to components
- **Graceful degradation**: Returns empty array if Directus unavailable (no crash)
- **No mock fallback**: Shows ErrorState if fetch fails

## Display Locations

| Location | Status | Behavior |
|----------|--------|----------|
| Main page | Done | Shows 3 latest releases |
| Project page | Future | Full list with infinite scroll |

## Remaining Work

- **Load more button**: Loads 3 more releases each click until exhausted

---

**Last Updated:** 2026-01-09