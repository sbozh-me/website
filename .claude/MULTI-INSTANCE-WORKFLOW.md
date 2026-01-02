# Multi-Instance Workflow Guide

**Purpose**: Run multiple Claude Code sessions in parallel without conflicts

**Use Cases**:
- Work on 1.3.0 feature while fixing bugs in another terminal
- Explore codebase in one instance while implementing in another
- Let Instance A handle long-running tasks while Instance B does quick fixes

---

## Quick Start

### Terminal 1 (Primary)
```bash
export CLAUDE_INSTANCE=A
cd /path/to/website
claude
```

### Terminal 2 (Secondary)
```bash
export CLAUDE_INSTANCE=B
cd /path/to/website
claude
```

Each instance maintains separate context but shares progress via the **pool**.

---

## How It Works

### Context Router
Each instance tracks its own attention state:
- **HOT files**: Recently mentioned, full content loaded
- **WARM files**: Mentioned earlier, headers only
- **COLD files**: Not in context

### Pool Coordinator
Instances share progress updates:
```
Instance A: "Completed blog redesign"
    ↓
Pool (.claude/pool/)
    ↓
Instance B: Loads pool at startup
    "I see Instance A finished blog redesign"
```

---

## Typical Workflows

### Scenario 1: Feature + Bugfix

**Terminal 1 (Instance A)**: Main feature work
```bash
export CLAUDE_INSTANCE=A
claude
```
Working on: "Implement 1.3.0 Release Notes collection"

**Terminal 2 (Instance B)**: Quick fixes
```bash
export CLAUDE_INSTANCE=B
claude
```
Working on: "Fix typo on 404 page"

**Result**: No conflicts, both instances make progress independently.

---

### Scenario 2: Exploration + Implementation

**Terminal 1 (Instance A)**: Deep exploration
```bash
export CLAUDE_INSTANCE=A
claude
# Ask: "How does the entire blog system work?"
# Builds comprehensive understanding
```

**Terminal 2 (Instance B)**: Implementation
```bash
export CLAUDE_INSTANCE=B
claude
# Work on: Specific feature with focused context
```

**Result**: Instance A maintains broad context, Instance B stays focused.

---

### Scenario 3: Parallel Features

**Terminal 1 (Instance A)**: Frontend work
```bash
export CLAUDE_INSTANCE=A
claude
# Working on: Release notes UI components
```

**Terminal 2 (Instance B)**: Backend work
```bash
export CLAUDE_INSTANCE=B
claude
# Working on: Directus collections setup
```

**Result**: Features progress in parallel, pool prevents duplicates.

---

## Pool Communication

### Manual Pool Entry

When completing significant work, signal to other instances:

```pool
INSTANCE: A
ACTION: completed
TOPIC: Blog sidebar redesign
SUMMARY: Added new BlogSidebar component with tag filtering
AFFECTS: apps/web/components/blog/BlogSidebar.tsx, packages/blog/src/components/Filters.tsx
BLOCKS: Can now start implementing tag-based navigation
```

### Automatic Pool Updates

The `pool-auto-update` hook automatically creates entries when it detects:
- File writes to critical paths
- Test runs
- Build completions
- Git commits

### Reading Pool

**Query recent activity**:
```bash
python3 ~/.claude/scripts/pool-query.py --since 1h
```

**Check specific instance**:
```bash
python3 ~/.claude/scripts/pool-query.py --instance A --since 30m
```

**All entries today**:
```bash
python3 ~/.claude/scripts/pool-query.py --since 24h
```

---

## Best Practices

### 1. Name Your Instances Meaningfully

Use letters that make sense to you:
- **A**: Main/primary work
- **B**: Quick fixes/experiments
- **C**: Research/exploration

Or use descriptive names:
```bash
export CLAUDE_INSTANCE=feature-1-3-0
export CLAUDE_INSTANCE=bugfix
```

### 2. Set Different Goals Per Instance

Don't have both instances doing the same thing. Instead:
- Instance A: Long-term feature development
- Instance B: Short-term fixes and improvements

### 3. Check Pool Before Starting

Before diving into work:
```bash
python3 ~/.claude/scripts/pool-query.py --since 2h
```

See what other instances (or past you) have been working on.

### 4. Coordinate on Shared Files

If both instances need to modify the same file:
- Use pool entries to signal intent
- Coordinate manually (don't edit simultaneously)
- Or: assign clear file ownership per instance

### 5. Commit From Primary Instance

Generally commit from Instance A (primary) to maintain clean git history.

Instance B can make commits for isolated fixes.

---

## Context Router Behavior

### Per-Instance Context

Each instance has independent attention state:

**Instance A** might have HOT:
- `apps/web/components/blog/Timeline.tsx`
- `packages/blog/src/data/repository.ts`

**Instance B** might have HOT:
- `apps/web/app/(main)/cv/page.tsx`
- `packages/pmdxjs/src/parser/index.ts`

No overlap = no confusion.

### Decay Happens Per-Instance

If Instance A mentions a file, only Instance A tracks its decay (HOT → WARM → COLD).

Instance B is unaffected.

---

## Troubleshooting

### "Instance ID shows as ?"

**Cause**: `CLAUDE_INSTANCE` not set in that terminal.

**Fix**:
```bash
export CLAUDE_INSTANCE=A
# Restart Claude
```

### "Pool entries not showing"

**Cause**: 5-minute cooldown on auto-updates.

**Fix**: Wait 5 minutes or create manual pool entry.

### "Both instances editing same file"

**Cause**: No automatic file locking.

**Fix**: Coordinate manually or use git branches:
```bash
# Instance A
git checkout -b feature/release-notes

# Instance B
git checkout -b fix/typo-404
```

### "Context router not showing"

**Cause**: Hooks not configured or Claude not restarted.

**Fix**:
1. Check `~/.claude/settings.json` has hooks
2. Restart Claude Code completely
3. Check `python3 ~/.claude/scripts/context-router-v2.py` runs without errors

---

## Advanced: Branch-Based Workflow

For maximum isolation:

**Instance A**: Feature branch
```bash
export CLAUDE_INSTANCE=A
git checkout -b feature/1-3-0-release-notes
claude
```

**Instance B**: Main branch
```bash
export CLAUDE_INSTANCE=B
git checkout main
claude
```

Work independently, merge when ready.

---

## Pool Entry Examples

### Completed Feature
```pool
INSTANCE: A
ACTION: completed
TOPIC: Release notes collection in Directus
SUMMARY: Created release_notes collection with version, date, type, content fields. Added relationships to projects.
AFFECTS: directus/schema.sql, apps/web/lib/directus/collections.ts
BLOCKS: Can now start building release notes UI
```

### Bug Fix
```pool
INSTANCE: B
ACTION: completed
TOPIC: Fixed double animation on main page
SUMMARY: Removed conditional return in AnalyticsProvider causing component remount. Animations now play once.
AFFECTS: apps/web/providers/AnalyticsProvider.tsx
BLOCKS: None
```

### Research Findings
```pool
INSTANCE: A
ACTION: researched
TOPIC: Blog filtering architecture
SUMMARY: Blog uses usePostFilters hook with client-side filtering. Persona, tags, date range supported. No server-side filtering needed.
AFFECTS: packages/blog/src/hooks/usePostFilters.ts
BLOCKS: Can implement filters UI without backend changes
```

### Blocked Work
```pool
INSTANCE: B
ACTION: blocked
TOPIC: PDF export failing in production
SUMMARY: PDF service returns 500. Need to check Puppeteer dependencies on server.
AFFECTS: services/pdf-generator/
BLOCKS: Cannot test PDF export until service fixed
```

---

## When to Use Multiple Instances

### ✅ Good Use Cases
- **Feature + Bugfix**: Main work + quick fixes
- **Exploration + Implementation**: Research broad, implement focused
- **Frontend + Backend**: Parallel development on separate layers
- **Long task + Short tasks**: Don't interrupt long flow for small fixes

### ❌ Bad Use Cases
- **Same file in both**: High conflict risk
- **Dependent features**: Instance B needs Instance A's code
- **Just because**: Don't over-complicate if single instance works fine

---

## Monitoring Your Instances

### List Active Instances
```bash
python3 ~/.claude/scripts/pool-query.py --since 8h | grep INSTANCE
```

Shows all instances that have been active recently.

### Check Your Current Instance
```bash
echo $CLAUDE_INSTANCE
# Should output: A (or B, C, etc.)
```

### View Context State
Each instance shows its own attention state in the header:
```
╔══ ATTENTION STATE [Turn 5] ══╗
║ 🔥 Hot: 3 │ 🌡️ Warm: 5 │ ❄️ Cold: 142 ║
╚═══════════════════════════════╝
```

---

## Summary

**Multi-instance workflow lets you**:
- Work on multiple features/fixes in parallel
- Maintain separate context per task
- Share progress automatically via pool
- Prevent conflicts and duplicate work

**Remember**:
1. Set `CLAUDE_INSTANCE` per terminal
2. Use pool to communicate between instances
3. Coordinate on shared files
4. Check pool before starting new work
5. Keep instance goals distinct

**Start simple**: Use A for main work, B for quick fixes. Expand as needed.

---

**Last Updated:** 2026-01-02
**Your Setup:** Instance A (default), ready for Instance B when needed