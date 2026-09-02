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

| Slug | Status | Tabs |
|------|--------|------|
| `sbozh-me` | beta | about, motivation, releases |
| `tecraft` | beta | about, motivation |

Tab content lives in `content/<slug>.ts` (MDX strings). `discord-community` was retired in v1.5.0; its old URLs redirect to `/projects` (see `next.config.ts`).

## Unusual Decisions

**Hardcoded instead of CMS**: Projects change rarely. Tab content (changelog, roadmap) is MDX that's easier to version in git than manage in CMS.

**Tabs are flexible**: Each project defines its own tabs array. Not all projects have all tabs.

---

**Last Updated:** 2026-09-02