# Release Notes

> **Location**: `packages/release-notes/`
> **Status**: In Progress (v1.3.0)

CMS-driven announcement system. Users see "what shipped" without navigating hardcoded changelog/roadmap tabs.

## What Exists

- **Package**: Types, repository interface, DirectusRepository implemented
- **Directus**: Collection created with fields: version, title, summary, date_released, project ref
- **CSS**: Shared prose styles via `packages/themes/` (prose.css, code.css, toc.css)

## Key Files

- `src/types/release.ts` - Release and ReleaseListItem interfaces
- `src/data/repository.ts` - Abstract repository interface
- `src/data/directus-repository.ts` - Directus implementation
- `src/components/` - Empty, UI lives in apps/web

## Design Decisions

- **Timeline layout** (Vercel changelog style): Date left, vertical line with dot, content right
- **Mobile**: Date moves to top of each entry
- **Rich content**: Supports prose, code blocks, images, callout boxes
- **No mock fallback** - show error state if CMS unavailable

## Display Locations

| Location | Behavior |
|----------|----------|
| Main page | Latest 3, "load more" expands in-place |
| Project page | Full list with infinite scroll |

## Next Step

Building timeline components for main page display.

---

**Last Updated:** 2026-01-07