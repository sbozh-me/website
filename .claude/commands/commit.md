---
description: Create a conventional commit with ovidius [simple|merge|push|deploy] [path] | draft release notes with livius [notes <version>]
---

Use the ovidius-commit-composer agent to create a conventional commit for staged changes.
In `notes` mode, use the livius-release-chronicler agent to draft a release note file instead.

Parameters can be provided in any order:

- "simple": Create simple commit with only subject line
- Path (e.g., "packages/ui" or "src/"): Stage only files from that directory before committing
- "notes" [version | from..to]: Draft a release note instead of committing (see below)
- "merge": Squash-deliver the current worktree branch onto main (branch lives on) — ovidius
  composes the delivery message, `.claude/scripts/ovidius-merge.sh` does the git mechanics
- "push" [patch|minor|major] [ignore]: Declare a version — ovidius composes a short note,
  `.claude/scripts/ovidius-push.sh` runs `scripts/release.sh` (CHANGELOG + bump), commits
  `chore(release): vX.Y.Z`, tags it, pushes main + the tag
- "deploy": Publish the image for main's declared version — `.claude/scripts/ovidius-deploy.sh`
  builds it on tecraft and pushes to ghcr only if missing; switching the server stays human

Parameter handling:

1. If a path is provided (contains "/" or is a valid directory):
   - Stage all modified and untracked files from that directory using `git add <path>`
   - Then proceed with commit

2. If "simple" is provided, instruct ovidius to:
   - Create a commit with ONLY the subject line (type(scope): description)
   - NO changelog body
   - NO footer credits/attribution
   - Provide ONLY the commit hash when done - no explanations

3. If "notes" is provided, use the **livius-release-chronicler** agent instead of ovidius:
   - Version: the argument after "notes" (e.g., `1.5.3`), a range (`1.5.1..1.5.3`, one note
     covering every version in the range, stamped with the last one), or — when omitted —
     the current version from the root `package.json`
   - Source of truth: the matching `## [x.y.z]` entries in `CHANGELOG.md`, plus `git log`
     between the version tags when a changelog line needs detail
   - Output: write `release-notes/<version>.md` (folder is git-ignored) in the exact format
     from the Livius agent definition, then print the file path and the full file content
   - Do NOT commit, stage, or touch git state in this mode; the file is for pasting into the
     Directus `release_notes` collection

4. If "merge" is provided, instruct ovidius to follow the "Delivery & Version Automation"
   flow from its own definition:
   - Study `git log main..HEAD` and `git diff main...HEAD --stat`
   - Compose the delivery message (full conventional format — what main RECEIVES, not a
     replay of branch history) and write it to a temp file
   - Call `.claude/scripts/ovidius-merge.sh <message-file>` — never hand-roll the merge.
     It works even when main is checked out nowhere (it borrows a temporary worktree)
   - The branch is NOT deleted and main is NOT pushed; report the delivery hash

5. If "push" is provided, instruct ovidius to:
   - Study what main accumulated since the last `vX.Y.Z` tag
   - Compose a 1–2 sentence plain-English note of what changed for visitors (no commit
     types, no file names) and write it to a temp file
   - Call `.claude/scripts/ovidius-push.sh {patch|minor|major} <note-file> [--ignore]`
     (default patch; `--ignore` only when the user says "ignore" = skip the coverage gate)
   - The script refuses when a newer release tag lives outside main, when origin/main is
     ahead, or when there is nothing to release — report the refusal verbatim, do not
     work around it
   - Report the version, hash, tag and note; suggest `/commit deploy` and `/commit notes`

6. If "deploy" is provided, instruct ovidius to:
   - Call `.claude/scripts/ovidius-deploy.sh` and WAIT for it (the build takes minutes —
     generous Bash timeout, never background it)
   - It is idempotent: if ghcr already has main's declared version it says "current";
     otherwise it builds the tagged commit on tecraft and pushes from there
   - Report the outcome verbatim, including any `make deploy-infra` note; switching the
     server (`make swv VERSION=X.Y.Z`) stays a human step

7. If no parameters provided, use ovidius normally with full changelog and attribution

Examples:

- `/commit simple` - Simple commit of staged changes
- `/commit packages/ui` - Stage all files in packages/ui, then full commit
- `/commit simple packages/ui` - Stage packages/ui files, then simple commit
- `/commit` - Full commit of staged changes (ask to stage all changed files in none are staged)
- `/commit notes` - Release note for the current version → `release-notes/<version>.md`
- `/commit notes 1.5.3` - Release note for 1.5.3
- `/commit notes 1.5.1..1.5.3` - One note covering 1.5.1 through 1.5.3
- `/commit merge` - Squash-deliver this worktree branch onto main (branch lives on)
- `/commit push` - Declare a patch version, push main + tag
- `/commit push minor` - Declare a minor version (coverage gate runs)
- `/commit push minor ignore` - Same, skipping the coverage gate
- `/commit deploy` - Build & push the web image to ghcr if main's version has none yet

IMPORTANT:
Do commit with --no-verify if wasnt asked otherwise
