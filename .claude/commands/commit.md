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
- "push" [patch|minor|major] [ignore]: Declare a version, on main only — Livius always drafts
  the release note, Plautus always writes Kagurame's scene for it (committed, so it ships in
  this version), then ovidius composes a short note and `.claude/scripts/ovidius-push.sh` runs
  `scripts/release.sh` (CHANGELOG + bump), commits `chore(release): vX.Y.Z`, tags it, pushes
  main + the tag and posts the release note to the site. Ends by asking "Deploy vX.Y.Z now?"
- "deploy": Put main's declared version live — `.claude/scripts/ovidius-deploy.sh` builds the
  image if ghcr lacks it, switches the server, checks the site, then mails the release note

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
   - Do NOT commit, stage, or touch git state in this mode, and do not post the note:
     `notes` only drafts
   - `/commit push` already drafts and posts the note for the version it declares; `notes` is
     for a redraft, a range, or an older version. When the user asks to put such a draft on
     the site: `node .claude/scripts/livius-publish.ts post <version>` (`--dry-run` shows the
     payload; it updates the note production has for that version, or creates it, mail off)

4. If "merge" is provided, instruct ovidius to follow the "Delivery & Version Automation"
   flow from its own definition:
   - Study `git log main..HEAD` and `git diff main...HEAD --stat`
   - Compose the delivery message (full conventional format — what main RECEIVES, not a
     replay of branch history) and write it to a temp file
   - Call `.claude/scripts/ovidius-merge.sh <message-file>` — never hand-roll the merge.
     It works even when main is checked out nowhere (it borrows a temporary worktree)
   - The branch is NOT deleted and main is NOT pushed; report the delivery hash

5. If "push" is provided, run these steps in order. Every step always runs; nothing here is
   asked per release. Stop at the first failure and report it verbatim.
   1. **Guards.** Run `.claude/scripts/ovidius-push.sh --check {patch|minor|major}`
      (default patch). A version is declared only by a session that sits on `main` in the
      main checkout, never from a worktree, and the script holds that rule. It also refuses
      a modified or staged tracked file (untracked files don't block), origin ahead, a
      release tag outside main, nothing to release. Report a refusal verbatim and stop: no
      stash, no worktree, no checkout to get around it. Its last line is the version about
      to be declared, `vX.Y.Z`.
   2. **Release note.** Use the **livius-release-chronicler** agent in push mode for
      `X.Y.Z`: the CHANGELOG has no entry yet, so his source is
      `git log <last-tag>..main` (the exact subjects `release.sh` will write) and
      `date_released` is today. He writes `release-notes/X.Y.Z.md` and touches no git
      state.
   3. **Kagurame's scenes.** Use the **plautus-kagurame-playwright** agent in release mode:
      the draft from step 2 is the release (not live yet), and it always gets a scene,
      `release-<slug>`. Then the usual pending feed review, so posts that went live since
      the last release ship in this image too (those he may skip). He edits the script and
      the ledger, runs `check`, and opens the graph.
   Steps 4 and 5 are one ovidius call (his definition has both).
   4. **Kagurame commit.** If Plautus changed anything under `apps/web/content/kagurame/`,
      ovidius commits exactly those files, subject only (e.g.
      `feat(web): Kagurame recites the <title> release`, or
      `chore(web): Plautus reviews <items>` when only the ledger changed), `--no-verify`.
      It lands before the release commit, so the CHANGELOG lists it and the tag ships it.
   5. **Declare.** Instruct ovidius to compose a 1–2 sentence plain-English note of what
      changed for visitors (no commit types, no file names; Livius's draft is a good
      source) into a temp file, then call
      `.claude/scripts/ovidius-push.sh {patch|minor|major} <note-file> [--ignore]`
      (`--ignore` only when the user says "ignore" = skip the coverage gate). The script
      declares nothing unless the draft from step 2 and the committed scene from steps 3–4
      exist. After pushing main + the tag it posts the note to the site itself, mail off
      (the release page is live at once, no deploy needed), and checks Kagurame's links
      against the live site. Exit 3: the version is declared but its note is not on the
      site; report the script's retry line.
   6. **Report** in one block: version, hash, tag, the note; the release note's URL (live
      now, not mailed yet); Plautus's verdicts and the graph path; anything the script
      flagged (a Kagurame link that doesn't answer, old tags that differ from origin's).
   7. **Ask once**, with AskUserQuestion: "Deploy vX.Y.Z now?" (Deploy now / Not now). On
      yes, run deploy mode (6 below) in this same turn. On no, stop: the note stays on the
      site unmailed, and `/commit deploy` does the rest whenever the user runs it.

   A failed step leaves earlier ones in place: the draft stays in `release-notes/`, and the
   Kagurame commit stays on local main, unpushed. Running `/commit push` again is safe:
   Livius redrafts but keeps the draft's slug (Kagurame already links to it), Plautus
   finds the release in his ledger and leaves its scene be, and the script updates the
   note production already has instead of posting a second one.

6. If "deploy" is provided (or the user answered "Deploy now" after a push), run
   `.claude/scripts/ovidius-deploy.sh` yourself. No agent: there is no text to compose.
   - Start it with the Bash tool in the background (a build takes 5–6 minutes) and wait for
     its completion notification. Never start a second one while it runs
   - It is the whole chain, and every step says so when it has nothing to do: the image
     (built on tecraft and pushed to ghcr only if missing) → the server's compose file must
     match the tag → `make swv VERSION=X.Y.Z` → the site must run that version and answer
     200 → the subscriber mail for the version's release note → Kagurame's links
   - Pass `--no-mail` only when the user asks for a release without mail
   - Report the output verbatim. A refusal (compose file differs, tecraft's disk, site not
     live) is the user's to resolve: never run `make deploy-infra`, remove anything on
     tecraft, or switch the server by hand to get around it. Exit 3: the version is live
     but its note was not mailed; report the script's retry line

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
- `/commit push` - Release note, Kagurame's scene, declare a patch version, push main + tag,
  post the note, then ask whether to deploy
- `/commit push minor` - Declare a minor version (coverage gate runs)
- `/commit push minor ignore` - Same, skipping the coverage gate
- `/commit deploy` - Put main's version live: image, server switch, check, mail

IMPORTANT:
Do commit with --no-verify if wasnt asked otherwise
