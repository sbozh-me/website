# Projects Module

> **Location**: `apps/web/lib/projects/`
> **Status**: Production
> **Routes**: `/projects`, `/projects/[slug]`, `/projects/[slug]/[tab]`

Projects showcase things being built in public. Currently hardcoded.

## Key Files

- `data.ts` - Project definitions and `getProjects()`, `getProject(slug)`
- `types.ts` - `Project`, `ProjectStatus`, `ProjectTab` interfaces
- `apps/web/app/(main)/projects/` - Route handlers

## Current Projects

| Slug | Status |
|------|--------|
| `sbozh-me` | beta |
| `discord-community` | beta |

Each project has tabs: about, motivation, changelog, roadmap.

## Unusual Decisions

**Hardcoded instead of CMS**: Projects change rarely. Tab content (changelog, roadmap) is MDX that's easier to version in git than manage in CMS.

**Tabs are flexible**: Each project defines its own tabs array. Not all projects have all tabs.

---

**Last Updated:** 2026-01-03