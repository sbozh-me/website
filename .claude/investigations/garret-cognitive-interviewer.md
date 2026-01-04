# Garret: Cognitive Context Interviewer

> **Status**: Implemented
> **Location**: `.claude/agents/garret-cognitive-interviewer.md`
> **Skill**: `/garret [topic]`

## Naming Origin

Named after **Garret Sutherland** ([GMaN1911](https://github.com/GMaN1911)), creator of [claude-cognitive](https://github.com/GMaN1911/claude-cognitive) - the system this project's context management is based on.

A harmless tribute and thank you: the cognitive interviewer agent carries the name of the person who developed the underlying context router and attention-based memory system that makes all of this possible.

## What It Does

Garret is a specialized agent that interviews users to extract project knowledge and writes it to `.claude/` cognitive files. The context router then injects these files based on keywords.

## Core Principles

1. **Short and focused** - Files ~30-50 lines, not comprehensive docs
2. **Guide, don't explain** - Point to where things live
3. **Separate current from planned** - Never mix existing code with future features
4. **Detail only the unusual** - Standard patterns need no explanation

## File Types

| Type | Purpose | Example |
|------|---------|---------|
| Current state | What EXISTS now | `modules/projects.md` |
| Planning | What's PLANNED | `modules/release-notes.md` |

## Interview Flow

1. **Identify type**: "Is this about something that EXISTS or something PLANNED?"
2. **Check existing**: Look in `.claude/` for related context
3. **Extract key info**: Where does it live? Any unusual decisions?
4. **Write focused file**: 30-50 lines, update router keywords

## Router Integration

After creating a file, Garret also updates `.claude/scripts/context-router-v2.py`:
- Adds keywords to activate the file
- Adds co-activation relationships
- Optionally pins the file (always WARM)

## Usage

```bash
/garret testing approach      # Interview about testing
/garret deployment workflow   # Document deployment
/garret                       # General interview
```

## Anti-Patterns

- Don't write 300-line docs
- Don't include code examples unless unusual
- Don't mix current state with future plans
- Don't add "Common Operations" or "Troubleshooting" sections

---

**Created**: 2026-01-04