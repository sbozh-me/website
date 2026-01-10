# Postmortem: Breadcrumbs with Release Title

**Date:** 2026-01-10
**Issue:** Adding release title to breadcrumbs caused blinking on render
**Resolution:** Route groups instead of client-side state management

---

## Problem Statement

Add release title to breadcrumbs on the release detail page (`/projects/[slug]/releases/[releaseSlug]`).

**Constraints:**
- Breadcrumbs are rendered in `ProjectLayout` (parent layout)
- Release title is only available in the page component (child)
- Must render instantly without blinking/flash

---

## Failed Approaches

### Attempt 1: React Context with useState

**Approach:**
```
BreadcrumbsProvider (in ProjectLayout)
  → ProjectBreadcrumbs (reads from context)
  → Page content
    → SetBreadcrumbs (writes to context via useEffect)
```

**Why it failed:**
- React renders parent components BEFORE children
- Render order: ProjectBreadcrumbs → Page → SetBreadcrumbs
- By the time SetBreadcrumbs runs its useEffect, breadcrumbs already painted
- Result: Flash from empty → populated segments

**Code that didn't work:**
```tsx
// SetBreadcrumbs.tsx
useEffect(() => {
  setSegments(segments);
  return () => clearSegments();
}, [segments]);
```

### Attempt 2: useSyncExternalStore

**Approach:**
- Replace useState with external store pattern
- Use `useSyncExternalStore` for synchronous updates
- Call `setSegments` during render (not in effect)

**Why it failed:**
- Same fundamental problem: parent renders before child
- Server returns empty segments (SSR snapshot)
- Client hydrates with empty, then child updates
- Result: Still blinks during hydration

**Code that didn't work:**
```tsx
// SetBreadcrumbs.tsx - calling during render
if (prevKeyRef.current !== segmentsKey) {
  store.setSegments(segments); // Runs after parent already rendered
}
```

### Attempt 3: CSS Hiding with Nested Layout

**Approach:**
- Create layout at `[releaseSlug]/layout.tsx`
- Inject CSS to hide parent breadcrumbs: `#project-breadcrumbs { display: none }`
- Render own breadcrumbs in the nested layout

**Why it failed:**
- Nested layouts wrap children, they don't replace parent content
- DOM structure:
  ```
  ProjectLayout
    → ProjectBreadcrumbs (hidden via CSS)
    → ProjectHeader
    → main
      → ReleaseDetailLayout
        → Breadcrumbs ← WRONG POSITION (inside main, below header)
      → Page content
  ```
- Breadcrumbs appeared in wrong location (inside content area, not at top)

---

## Successful Approach: Route Groups

**Key Insight:** In Next.js App Router, route groups `(folder-name)` allow different layouts for the same URL pattern.

**Structure:**
```
app/(main)/
├── projects/[slug]/                    ← Default layout
│   ├── layout.tsx                      ← Renders ProjectLayout
│   └── releases/
│       └── page.tsx                    ← Uses parent layout
└── (release-detail)/                   ← Route group (URL: same)
    └── projects/[slug]/releases/[releaseSlug]/
        ├── layout.tsx                  ← OWN layout with breadcrumbs
        └── page.tsx
```

**How it works:**
1. Route group `(release-detail)` doesn't affect URL
2. URL `/projects/sbozh-me/releases/v1.0` matches route group path
3. Route group has its OWN layout that:
   - Fetches project data (from static array)
   - Fetches release title (from Directus)
   - Renders `ProjectLayout` with custom `breadcrumbs` prop
4. Everything is server-rendered - title is in HTML from first byte

**Working code:**
```tsx
// (release-detail)/projects/[slug]/releases/[releaseSlug]/layout.tsx
export default async function ReleaseDetailLayout({ params, children }) {
  const { slug, releaseSlug } = await params;

  const project = getProject(slug);
  const releaseTitle = await getReleaseTitle(releaseSlug);

  const breadcrumbSegments = [
    { label: "Projects", href: "/projects" },
    { label: project.title, href: `/projects/${slug}` },
    { label: "Releases", href: `/projects/${slug}/releases` },
    ...(releaseTitle ? [{ label: releaseTitle }] : []),
  ];

  return (
    <ProjectLayout
      project={project}
      breadcrumbs={<Breadcrumbs segments={breadcrumbSegments} />}
    >
      {children}
    </ProjectLayout>
  );
}
```

---

## Root Cause Analysis

| Approach | Failure Reason |
|----------|----------------|
| React Context | Parent renders before child; useEffect runs after paint |
| useSyncExternalStore | SSR/hydration mismatch; server has no segments |
| CSS Hiding | Nested layouts wrap content, can't replace parent DOM position |
| **Route Groups** | ✅ Own layout renders ProjectLayout directly with all data |

**The fundamental issue:** Trying to pass data UP the component tree (child → parent) in a server-rendered environment.

**The solution:** Restructure so data flows DOWN (layout has all data, passes to children).

---

## Key Learnings

1. **Next.js layouts are additive, not replaceable**
   - Nested layouts wrap children
   - They cannot modify what parent layouts render
   - Only route groups allow different layouts for same URL

2. **Client-side state always causes hydration flash**
   - Server renders initial state
   - Client hydrates with same state
   - Then state updates → visible flash
   - No amount of `useSyncExternalStore` or `useLayoutEffect` fixes this

3. **Route groups are the escape hatch**
   - `(folder-name)` doesn't affect URL
   - Allows completely different layout trees
   - Each route group can fetch its own data server-side

4. **Server Components solve the data problem**
   - Layout can be async and fetch data
   - All data available at render time
   - No client-side state needed
   - No hydration mismatch possible

---

## Files Changed

**Created:**
- `app/(main)/(release-detail)/projects/[slug]/releases/[releaseSlug]/layout.tsx`
- `components/projects/Breadcrumbs.tsx` (server component)

**Modified:**
- `components/projects/ProjectLayout.tsx` (added optional `breadcrumbs` prop)

**Moved:**
- `[releaseSlug]/page.tsx` → `(release-detail)/[releaseSlug]/page.tsx`

---

## Prevention

For future similar requirements:

1. **Ask first:** "Does the parent component need data from a child?"
2. **If yes:** Consider route groups or restructuring data flow
3. **Never:** Try to lift state from server component child to parent via client context
4. **Remember:** In Next.js App Router, data should flow DOWN, not UP
