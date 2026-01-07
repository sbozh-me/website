# Release Notes Component Location Mistake

**Date**: 2026-01-07
**Severity**: Medium
**Time Lost**: ~1 hour

## What Happened

Created release-notes timeline components in `apps/web/components/release-notes/` instead of `packages/release-notes/src/components/` where they should live according to the blog package pattern.

## Root Cause

The cognitive doc (`modules/release-notes.md`) stated:

> `src/components/` - Empty, UI lives in apps/web

This was ambiguous. It could mean:
1. "Components are empty because UI is rendered in apps/web pages" (correct interpretation for page-level rendering)
2. "Put UI components in apps/web, not in the package" (wrong interpretation that was followed)

The blog package pattern shows components should live in the package (`packages/blog/src/components/timeline/`) and be imported by apps/web pages.

## What Should Have Happened

1. Check blog package structure as reference pattern
2. Create components in `packages/release-notes/src/components/`
3. Export components from package index
4. Import and use in apps/web pages

Package components are reusable and testable. App components are page-specific compositions.

## Prevention

1. **Update cognitive docs**: Be explicit about component location patterns
2. **Reference pattern**: When creating new packages similar to existing ones, explicitly reference the existing pattern
3. **Clarify "UI lives in apps/web"**: This phrase should mean "pages that render UI" not "component definitions"

## Action Items

- [x] Update `modules/release-notes.md` to clarify component location
- [x] Move components from `apps/web/components/release-notes/` to `packages/release-notes/src/components/`
- [ ] Add pattern note to main CLAUDE.md about package vs app component locations
