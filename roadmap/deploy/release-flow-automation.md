# Release flow automation: handoff

> **Start a new session with:**
> `Read roadmap/deploy/release-flow-automation.md and implement it.`

You are picking up a tooling chore on sbozh.me (repo `/Users/oktavian/WebstormProjects/website`).
The author wants the whole release to run from one session with no manual steps. In their words:
*"I was asking you to automate all of this for me. Like Kagurame update and release notes
posting."* The flow they want:

```
worktree  →  /commit merge  →  /commit push  →  "Deploy vX.Y.Z now?"  →  live
            (squash to main)   (release note +     (one confirmation)    (image, server switch,
                                Kagurame scenes,                          note posted to Directus,
                                version declared)                         links verified)
```

This is tooling, so it needs no ROADMAP.md entry. It must not slip any site feature in.

---

## 1. First: check where things stand (read-only)

Before changing anything, find out:

- **Which version is live:** `ssh sbozhme "docker inspect sbozh-me-production-web-1 --format '{{.Config.Image}}'"`.
  On 2026-11-16, v1.11.0 was tagged, pushed, and its image was on ghcr, but the server switch was the author's step and may not have happened.
- **Which release notes are in prod Directus:** use the read pattern in "Directus writes" below, with `GET /items/release_notes?fields=version,slug,status&sort=-date_released&limit=5`.
  Known backlog: 1.10.12 is drafted in `release-notes/1.10.12.md` but not posted, 1.10.13 has no note, and 1.11.0 is drafted in `release-notes/1.11.0.md` (slug `a-poster-for-gta-is-near`; Kagurame already links to it).
- **`git status`** in the main checkout. Other sessions work here; never touch their WIP.

## 2. Ask the author only these, together, at the start

1. **Release-note emails.** Notes mail subscribers only when `notify_subscribers` is on (posts mail by default). Should every release be mailed by default? The author complained that release-note mail "is not working", which suggests yes.
2. **Confirmation gate.** Should one "Deploy vX.Y.Z now?" prompt cover the build, server switch and note posting? Or should there be a second prompt right before the server switch?
3. **Backlog.** Should the new tool post 1.10.12, 1.10.13 (Livius drafts it first) and 1.11.0 now, and with or without mail? A note dated more than 3 days ago is marked as announced without being mailed, by design.

Everything else has a sensible default below. Pick it, and mention the choice in your report.

## 3. What already exists (read before writing code)

| File | What it does today |
|---|---|
| `.claude/commands/commit.md` | All `/commit` modes. Push mode: guards → Livius draft → Plautus scenes → Kagurame commit → declare |
| `.claude/scripts/ovidius-lib.sh` | Finds the main checkout (refuses if dirty) or borrows a temp worktree; gh-credential git remote calls |
| `.claude/scripts/ovidius-merge.sh` | `/commit merge`: squash-delivers a worktree branch onto main (branch lives on, main not pushed) |
| `.claude/scripts/ovidius-push.sh` | `--check {type}`: guards only, last line `vX.Y.Z`. Without it: release.sh (CHANGELOG + bump + 90% gate for minor/major), release commit, tag, push |
| `.claude/scripts/ovidius-deploy.sh` | Builds the tagged commit on **tecraft** (`docker --host ssh://tecraft`), pushes to ghcr, removes the local image. Says `current` if ghcr has it. Prints a `make deploy-infra` note when `deploy/production/website` changed |
| `.claude/agents/livius-release-chronicler.md` | Drafts `release-notes/<v>.md` (git-ignored). Has a "Push mode" (source: `git log <tag>..main`, date today, keep the slug on re-runs) |
| `.claude/agents/plautus-kagurame-playwright.md` | Writes Kagurame's scenes. "Release mode": reviews the release from Livius's draft (guid built from the slug), then the pending feed; `check`, `mark`, `graph --open` |
| `.claude/scripts/plautus.ts` | `check [--live]`, `graph [--open]`, `pending`, `mark` |
| `.claude/modules/kagurame.md` | The Kagurame flow and format |
| `Makefile` | `swv`/`switch-web-version` (sets `WEB_IMAGE_TAG` in the server .env, `docker compose pull web && up -d web`), `deploy-infra` |
| `apps/web/lib/announcements/service.ts` | `/api/announce` sweep: published + date ≤ now + `notify_subscribers` + `announced_at` empty. `MAX_AGE_MS` = 3 days |

## 4. What to build

### A. `/commit push` from the worktree session

Today push mode refuses unless the session is on `main`. That breaks "worktree → merge → push" in one session. Make it work from the worktree:

- Every step must act on the **main checkout** (`$MAIN` from `ovidius_main_checkout`, normally `/Users/oktavian/WebstormProjects/website`), not the worktree:
  - Livius writes `release-notes/` there (see memory `release-notes-folder-main-checkout`).
  - Plautus edits `apps/web/content/kagurame/` there.
  - The Kagurame commit lands on main.
- Pass absolute paths to the agents.
- If main is checked out nowhere, the push needs one worktree that lives for the whole flow. Today `ovidius_tmp_tree` removes it on exit. Decide and document how that works, for example a named worktree that the final step removes.

### B. Post the release note to prod Directus

Add a script, e.g. `.claude/scripts/livius-publish.sh <version>` (or `.ts`). It should:

- **Parse** `release-notes/<v>.md`:
  - From the table: `title`, `slug`, `version`, `type`, `date_released`, `project`.
  - The body below `---` becomes `summary` (markdown, from the first `##` on).
  - The `media` row has **no Directus field**: drop it.
- **Build the payload:**
  - `version` gets the `v` prefix (`"v1.11.0"`).
  - `status: "published"`.
  - `project`: the sbozh.me id `0c8fe541-aaf3-4669-a523-26bce5fa8b36`.
  - `notify_subscribers`: per the author's answer.
  - `date_released`: a naive datetime that Directus reads as **UTC**. Stamp the posting time in UTC, not CET; CET mails about an hour late.
- **Be idempotent by `version`:** GET first; PATCH if the version exists, POST otherwise. Never leave two notes for one version. Never fill `announced_at` (it is the "already sent" marker; filling it silently blocks the mail).
- **Support `--dry-run`:** print the payload, never the token.
- **Afterwards:**
  - `curl -s -o /dev/null -w '%{http_code}' https://sbozh.me/projects/sbozh-me/releases/<slug>` should return 200.
  - `node .claude/scripts/plautus.ts check --live` should pass; Kagurame's new reply links there.

**Directus writes** only work from the server, because the token lives in the server `.env` and `apps/web/.env.local` points at local Directus, which lags prod:

```
scp payload.json sbozhme:/tmp/x.json
ssh -n sbozhme 'cd /opt/sbozh-me && set -a && . ./.env && set +a && curl -s -X POST \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" -H "Content-Type: application/json" \
  --data @/tmp/x.json "$PUBLIC_URL/items/release_notes"'
```

Remove `/tmp/x.json` on the server afterwards.

### C. The deploy chain behind one prompt

At the end of `/commit push`, ask once (AskUserQuestion): **"Deploy vX.Y.Z now?"** On yes, run `/commit deploy`, which becomes the full chain. On no, stop; `/commit deploy` later runs the same chain.

1. **tecraft disk:** check `ssh tecraft "df -h /"` first. 7.7 GB free was enough on 2026-11-16, and a build died at 94% full on 2026-11-15. You may only remove `ghcr.io/sbozh-me/website` images that ghcr also has. tecraft is the tecraft.cz production host: ask before removing anything else.
2. **Build and push:** run `ovidius-deploy.sh`. It takes about 5–6 minutes. The Bash tool moves long commands to the background after about 3 minutes, so wait for the completion notification. Never start a second build.
3. **Infra:** when the script prints the `make deploy-infra` note, diff the server's `/opt/sbozh-me/docker-compose.yaml` against the repo copy first. If they're equal, skip. If not, deploy-infra is needed, but it **overwrites the server `.env`** with `deploy/production/website/.env`. That wiped `SUBSCRIBE_SECRET` and `ANNOUNCE_SECRET` on 2026-11-10. Compare the key **names** of both files (never print values) and refuse if the server has keys the local file lacks.
4. **Switch:** `make swv VERSION=X.Y.Z`, always with the explicit target. Its `up -d web` also recreates Directus when Directus's env changed (web depends on it), which re-arms the announcement flows. Expect that.
5. **Verify** that the live image tag is the new version and `https://sbozh.me` returns 200.
6. **Publish** the release note (B). Then verify the release page and `plautus.ts check --live`.
7. **Report:** version live, note URL, mail on or off, Kagurame check result.

The old rule "switching the server stays a human step" now becomes "the server switch happens only after the deploy prompt". Update that wording everywhere it appears:
- `commit.md`
- `ovidius-commit-composer.md` (`/commit deploy` section)
- `ovidius-push.sh` and `ovidius-deploy.sh` final lines
- `.claude/CLAUDE.md`
- memory `ghcr-push-via-tecraft`

### D. Fix found along the way

`ovidius-push.sh` fetches `origin main --tags`. Three old tags (`mermaid-0.0.2`, `v0.6.0`, `v1.1.2`) differ from origin, so the fetch exits non-zero ("would clobber existing tag"). The script then warns "guards run on local refs only", and the origin-ahead guard runs on a stale `origin/main`.

Fetch `main` on its own so that guard is real. Don't force-update the old tags: report them to the author instead.

### E. Docs and tests

- **Docs:** update `commit.md` (the flow above), the three agent definitions, `.claude/modules/kagurame.md` (Flow), and `.claude/commands/plautus.md`.
- **Tests for the new script:** `--dry-run` against `release-notes/1.11.0.md` (the payload is correct and has no token), plus a parse test for a note without optional sections.
- **Before any commit that touches the Kagurame script or the web app:** run the full web suite (`cd apps/web && npx vitest run`) and `packages/blog`. `HeroDialogue.test.tsx` presses reply keys by position against the real script; that broke the 1.11.0 gate.

## 5. House rules (all apply)

- **Commits:** via `/commit` (Ovidius), with `--no-verify`. Never suggest PRs; delivery is `/commit merge`, then `/commit push`.
- **Who touches git:** Livius and Plautus never touch git state. Scripts own the git mechanics; agents compose text.
- **`make`:** never run bare `make` or `make -p`. The first target is `patch`, and it bumps the version.
- **Secrets:** never print `DIRECTUS_TOKEN`, `ANNOUNCE_SECRET`, `SUBSCRIBE_SECRET` or `SMTP_PASSWORD`. Treat the author's email as private.
- **Server hostnames:** on the server's shared Docker network, `web` also resolves to renbg's container. Use container names (`sbozh-me-production-web-1`).
- **Refusals:** report a refusal from any `ovidius-*` script verbatim. Don't work around it.
- **Committing this work:** a tooling commit via `/commit simple`. No release is needed unless the author asks.

## 6. Done when

The next real release runs worktree → `/commit merge` → `/commit push` → "yes" → live, with no hand steps, and ends with:

- the new image live;
- the release note posted (and mailed, if chosen) at its slug, returning 200;
- Kagurame's new reply resolving (`check --live` passes);
- one report.
