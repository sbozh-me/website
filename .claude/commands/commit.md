---
description: Create a conventional commit with ovidius [simple] [path] | draft release notes [notes <version>]
---

Use the ovidius-commit-composer agent to create a conventional commit for staged changes,
or — in `notes` mode — to draft a release note file.

Parameters can be provided in any order:

- "simple": Create simple commit with only subject line
- Path (e.g., "packages/ui" or "src/"): Stage only files from that directory before committing
- "notes" [version | from..to]: Draft a release note instead of committing (see below)

Parameter handling:

1. If a path is provided (contains "/" or is a valid directory):
   - Stage all modified and untracked files from that directory using `git add <path>`
   - Then proceed with commit

2. If "simple" is provided, instruct ovidius to:
   - Create a commit with ONLY the subject line (type(scope): description)
   - NO changelog body
   - NO footer credits/attribution
   - Provide ONLY the commit hash when done - no explanations

3. If "notes" is provided, instruct ovidius to run its **Release Notes Mode**:
   - Version: the argument after "notes" (e.g., `1.5.3`), a range (`1.5.1..1.5.3`, one note
     covering every version in the range, stamped with the last one), or — when omitted —
     the current version from the root `package.json`
   - Source of truth: the matching `## [x.y.z]` entries in `CHANGELOG.md`, plus `git log`
     between the version tags when a changelog line needs detail
   - Output: write `release-notes/<version>.md` (folder is git-ignored) in the exact format
     from the agent definition, then print the file path and the full file content
   - Do NOT commit, stage, or touch git state in this mode; the file is for pasting into the
     Directus `release_notes` collection

4. If no parameters provided, use ovidius normally with full changelog and attribution

Examples:

- `/commit simple` - Simple commit of staged changes
- `/commit packages/ui` - Stage all files in packages/ui, then full commit
- `/commit simple packages/ui` - Stage packages/ui files, then simple commit
- `/commit` - Full commit of staged changes (ask to stage all changed files in none are staged)
- `/commit notes` - Release note for the current version → `release-notes/<version>.md`
- `/commit notes 1.5.3` - Release note for 1.5.3
- `/commit notes 1.5.1..1.5.3` - One note covering 1.5.1 through 1.5.3

IMPORTANT:
Do commit with --no-verify if wasnt asked otherwise
