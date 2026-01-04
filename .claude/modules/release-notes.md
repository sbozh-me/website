# Release Notes (Planned)

> **Target**: v1.3.0
> **Why**: User-facing view that merges changelog + roadmap for visitors

Release notes will be a CMS-driven announcement system. Users see "what shipped" without navigating hardcoded changelog/roadmap tabs.

## Decisions Made

- **Directus collection**, follows blog's repository pattern
- **References projects** - each release note belongs to a project
- **Fields**: version, title, summary, date_released
- **No mock fallback** - show error state if CMS unavailable
- **Only shipped releases** - no "planned" type, roadmap stays hardcoded

## Display Locations

| Location | Behavior |
|----------|----------|
| Main page | Latest 3, "load more" expands in-place |
| Project page | Full list with infinite scroll |

## Package Structure

Will live in `packages/release-notes/` following `packages/blog/` pattern.

---

**Last Updated:** 2026-01-03