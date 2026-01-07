# Postmortem Procedure

When something goes wrong during implementation, create a postmortem to capture lessons learned.

## When to Create a Postmortem

- Incorrect architectural decisions that required rework
- Misleading documentation that caused wrong implementation
- Integration mistakes between packages
- Any implementation that had to be undone or significantly refactored

## File Naming

`YYYY-MM-DD-brief-description.md`

Example: `2026-01-07-release-notes-component-location.md`

## Template

```markdown
# [Brief Title]

**Date**: YYYY-MM-DD
**Severity**: Low | Medium | High
**Time Lost**: ~X hours

## What Happened

[1-2 sentences describing the mistake]

## Root Cause

[Why did this happen? What was misleading or unclear?]

## What Should Have Happened

[The correct approach]

## Prevention

[How to prevent this in the future - docs updates, patterns to follow, checks to add]

## Action Items

- [ ] Specific action 1
- [ ] Specific action 2
```

## Process

1. Create postmortem file in `/postmortem/`
2. Fill out all sections honestly
3. Complete action items (especially doc updates)
4. Reference postmortem in cognitive docs if relevant pattern emerges
