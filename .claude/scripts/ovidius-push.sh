#!/bin/bash
# Ovidius automation — /commit push: declare a version on main and publish it.
#
#   1. guards: the session sits on main in the main checkout (a version is
#      never declared from a worktree), no tracked file is modified, origin is
#      not ahead, no released tag lives outside main (releases have shipped
#      from unmerged worktrees before), the new tag does not exist, and main
#      has commits since the last release;
#   2. the release's two texts exist: Livius's draft release-notes/X.Y.Z.md
#      and Kagurame's scene for it, committed. No version is declared without
#      them;
#   3. runs scripts/release.sh — CHANGELOG entry, version bump in root, apps/*
#      and packages/*, and the 90% coverage gate for minor/major;
#   4. commits `chore(release): vX.Y.Z` with ovidius' short note in the body;
#   5. tags vX.Y.Z (annotated: note + CHANGELOG entry);
#   6. pushes main and the new tag;
#   7. posts the release note to the site (livius-publish.ts post), mail off.
#
# Going live is /commit deploy: image, server switch, then the mail.
#
# Usage: ovidius-push.sh {patch|minor|major} <note-file> [--ignore]
#        ovidius-push.sh --check {patch|minor|major}
#   --ignore  skip the minor/major coverage gate (= make minor-ignore)
#   --check   run the guards only (step 1) and print the version that would be
#             declared (last line: vX.Y.Z). /commit push calls it first, so
#             Livius and Plautus write for the right version before anything
#             is committed.
#
# Exit 3: the version is declared and pushed, but its note is not on the site.
set -euo pipefail

USAGE="usage: ovidius-push.sh {patch|minor|major} <note-file> [--ignore] | --check {patch|minor|major}"
CHECK=
if [[ "${1:-}" == "--check" ]]; then
  CHECK=1
  shift
fi
TYPE=${1:?$USAGE}
[[ "$TYPE" =~ ^(patch|minor|major)$ ]] || { echo "$USAGE" >&2; exit 1; }
IGNORE=
if [[ -z "$CHECK" ]]; then
  NOTE_SRC=${2:?$USAGE}
  IGNORE=${3:-}
  [[ -z "$IGNORE" || "$IGNORE" == "--ignore" ]] || { echo "$USAGE" >&2; exit 1; }
  NOTE_PATH=$(cd "$(dirname "$NOTE_SRC")" && pwd)/$(basename "$NOTE_SRC")
  [[ -s "$NOTE_PATH" ]] || { echo "release note file '$NOTE_SRC' is missing or empty" >&2; exit 1; }
fi

SCRIPTS=$(cd "$(dirname "$0")" && pwd)
# shellcheck source=ovidius-lib.sh
source "$SCRIPTS/ovidius-lib.sh"
ovidius_release_checkout

# main on its own: the guard below must see origin as it is now.
if ! ovidius_git_remote "$MAIN" fetch -q origin main; then
  echo "cannot fetch origin/main — a release needs origin (network? gh auth status?)" >&2
  exit 1
fi
# Tags apart from it: a few old tags differ from origin's, which makes
# `fetch --tags` exit non-zero while the new tags still arrive.
CLOBBERED=$(ovidius_git_remote "$MAIN" fetch origin --tags 2>&1 | sed -n 's/^ ! \[rejected\] *\([^ ]*\) .*would clobber.*/\1/p' | paste -sd' ' - || true)
[[ -z "$CLOBBERED" ]] || echo "note: old tags differ from origin's and were left alone: $CLOBBERED"
if ! git -C "$MAIN" merge-base --is-ancestor origin/main main 2>/dev/null; then
  echo "origin/main has commits that local main lacks — pull main first" >&2
  exit 1
fi

# The newest release tag must be part of main, or we would re-cut a version
# that already shipped from somewhere else.
LATEST=$(git -C "$MAIN" tag -l 'v[0-9]*.[0-9]*.[0-9]*' --sort=-v:refname | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' | head -1 || true)
if [[ -n "$LATEST" ]] && ! git -C "$MAIN" merge-base --is-ancestor "$LATEST" main; then
  echo "$LATEST is not on main — it was released from another branch:" >&2
  git -C "$MAIN" branch -a --contains "$LATEST" | sed 's/^/  /' >&2
  echo "deliver that branch first (/commit merge from it), then push" >&2
  exit 1
fi

CURRENT=$(node -p "require('$MAIN/package.json').version")
if [[ -n "$LATEST" && "v$CURRENT" != "$LATEST" ]]; then
  echo "main's package.json says $CURRENT but the newest tag is $LATEST — fix that before declaring" >&2
  exit 1
fi
if [[ -n "$LATEST" && -z "$(git -C "$MAIN" log --oneline "$LATEST..main")" ]]; then
  echo "nothing to release: main has no commits since $LATEST" >&2
  exit 1
fi

IFS='.' read -r major minor patch <<<"$CURRENT"
case $TYPE in
  major) NEW="$((major + 1)).0.0" ;;
  minor) NEW="${major}.$((minor + 1)).0" ;;
  patch) NEW="${major}.${minor}.$((patch + 1))" ;;
esac
if git -C "$MAIN" rev-parse -q --verify "refs/tags/v$NEW" >/dev/null; then
  echo "tag v$NEW already exists — refusing to redeclare" >&2
  exit 1
fi
if [[ -n "$CHECK" ]]; then
  echo "ready: v$NEW ($TYPE, was v$CURRENT), $(git -C "$MAIN" rev-list --count "${LATEST:+$LATEST..}main") commits since ${LATEST:-the start}"
  echo "v$NEW"
  exit 0
fi

# Both texts of the release must be there before it exists: Livius's draft
# (posted below, once the tag is out) and Kagurame's scene (in this version's
# image, because it is committed already).
if ! SLUG=$(node "$SCRIPTS/livius-publish.ts" check "$NEW" | tail -1); then
  echo "v$NEW has no usable release note draft — /commit push has Livius write it before declaring" >&2
  exit 1
fi
if ! SCENE=$(node "$SCRIPTS/plautus.ts" released "$SLUG"); then
  echo "v$NEW has no Kagurame scene — /commit push has Plautus write it (and Ovidius commit it) before declaring" >&2
  exit 1
fi
echo "declaring v$NEW ($TYPE, was v$CURRENT) · note $SLUG · scene $SCENE"

# The coverage gate needs dependencies; a borrowed worktree has none.
if [[ "$TYPE" != "patch" && -z "$IGNORE" && ! -d "$MAIN/node_modules" ]]; then
  echo "installing dependencies for the coverage gate..."
  (cd "$MAIN" && pnpm install --frozen-lockfile --prefer-offline >/dev/null)
fi

(cd "$MAIN" && ./scripts/release.sh "$TYPE" ${IGNORE:+"$IGNORE"})

BUMPED=$(node -p "require('$MAIN/package.json').version")
if [[ "$BUMPED" != "$NEW" ]]; then
  git -C "$MAIN" reset -q --hard HEAD
  echo "release.sh bumped to $BUMPED, expected $NEW — changes reverted" >&2
  exit 1
fi

# The CHANGELOG entry release.sh just wrote: from "## [NEW]" to the next "## [".
ENTRY=$(awk -v v="## [$NEW]" 'index($0, v) == 1 {on=1; next} on && /^## \[/ {exit} on' "$MAIN/CHANGELOG.md")

COMMIT_MSG=$(mktemp)
TAG_MSG=$(mktemp)
{
  echo "chore(release): v$NEW"
  echo
  cat "$NOTE_PATH"
} >"$COMMIT_MSG"
{
  cat "$NOTE_PATH"
  echo
  echo "$ENTRY"
} >"$TAG_MSG"

git -C "$MAIN" add -A CHANGELOG.md package.json apps/*/package.json packages/*/package.json
git -C "$MAIN" commit -q --no-verify -F "$COMMIT_MSG"
# verbatim: the CHANGELOG's "### Changes" would otherwise be stripped as a comment.
git -C "$MAIN" tag -a --cleanup=verbatim "v$NEW" -F "$TAG_MSG"
rm -f "$COMMIT_MSG" "$TAG_MSG"

if ! ovidius_git_remote "$MAIN" push origin main "v$NEW"; then
  echo "push failed — v$NEW is committed and tagged on local main; retry: git push origin main v$NEW, then: node .claude/scripts/livius-publish.ts post $NEW" >&2
  exit 1
fi

echo "declared v$NEW ($TYPE, was v$CURRENT) @ $(git -C "$MAIN" rev-parse --short HEAD) · tagged v$NEW · pushed main + v$NEW"

# The note goes on the site now: its page is dynamic, so it is live without a
# deploy. The mail waits for /commit deploy.
POSTED=1
node "$SCRIPTS/livius-publish.ts" post "$NEW" || POSTED=
# Kagurame's links, the new note's among them, against the live site.
node "$SCRIPTS/plautus.ts" check --live || echo "note: one of Kagurame's links doesn't answer on sbozh.me (above)"

if [[ -z "$POSTED" ]]; then
  echo "v$NEW is declared and pushed, but its release note is NOT on the site — retry: node .claude/scripts/livius-publish.ts post $NEW" >&2
  exit 3
fi
echo "next: /commit deploy — image, server switch, then the mail for this note"
