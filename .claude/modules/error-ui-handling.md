# Error UI Handling

> **Pattern**: Graceful degradation for CMS failures
> **Status**: Production
> **Used by**: Blog, Release Notes, any Directus-connected feature

## ErrorState Component

Each package has its own ErrorState with identical structure:
- `packages/blog/src/components/timeline/ErrorState.tsx`
- `packages/release-notes/src/components/ErrorState.tsx`

Displays: warning icon (triangle), title, message, optional status code badge.

```tsx
<ErrorState
  title="Unable to load posts"      // defaults provided per package
  message={error.message}
  status={error.status}             // optional, shows as code badge
/>
```

## DirectusError Class

Location: `packages/blog/src/data/directus-repository.ts`

Wraps CMS errors with message + optional HTTP status. Use `DirectusError.fromError(e)` to normalize any caught error.

## Page-Level Patterns

**Blog approach** (direct try/catch):
```typescript
let error: DirectusError | null = null;
try { posts = await repository.getPosts(); }
catch (e) { error = DirectusError.fromError(e); }
// Render: error ? <ErrorState /> : <Timeline />
```

**Release notes approach** (Result type):
```typescript
type Result = { success: true; data: T[] } | { success: false; error: string; status?: number };
// Render: result.success ? <Timeline /> : <ErrorState />
```

Both work. Result type is cleaner for complex flows; direct try/catch is simpler for single fetches.

## Principle

Never crash the page. Catch errors at data fetch, render ErrorState in place of content. User sees friendly message, page remains functional.