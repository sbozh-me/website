#!/bin/bash
# Ovidius automation — /commit push: declare a version on main and publish it.
#
#   1. guards: no released tag may live outside main (releases have shipped
#      from unmerged worktrees before), the new tag must not exist, and main
#      must have commits since the last release;
#   2. runs scripts/release.sh — CHANGELOG entry, version bump in root, apps/*
#      and packages/*, and the 90% coverage gate for minor/major;
#   3. commits `chore(release): vX.Y.Z` with ovidius' short note in the body;
#   4. tags vX.Y.Z (annotated: note + CHANGELOG entry);
#   5. pushes main and the new tag.
#
# Building the image is /commit deploy; switching the server stays human.
#
# Usage: ovidius-push.sh {patch|minor|major} <note-file> [--ignore]
#   --ignore  skip the minor/major coverage gate (= make minor-ignore)
set -euo pipefail

USAGE="usage: ovidius-push.sh {patch|minor|major} <note-file> [--ignore]"
TYPE=${1:?$USAGE}
NOTE_SRC=${2:?$USAGE}
IGNORE=${3:-}
[[ "$TYPE" =~ ^(patch|minor|major)$ ]] || { echo "$USAGE" >&2; exit 1; }
[[ -z "$IGNORE" || "$IGNORE" == "--ignore" ]] || { echo "$USAGE" >&2; exit 1; }
NOTE_PATH=$(cd "$(dirname "$NOTE_SRC")" && pwd)/$(basename "$NOTE_SRC")
[[ -s "$NOTE_PATH" ]] || { echo "release note file '$NOTE_SRC' is missing or empty" >&2; exit 1; }

# shellcheck source=ovidius-lib.sh
source "$(dirname "$0")/ovidius-lib.sh"
ovidius_main_checkout

ovidius_git_remote "$MAIN" fetch -q origin main --tags || echo "warning: fetch failed — guards run on local refs only" >&2
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
echo "declaring v$NEW ($TYPE, was v$CURRENT)"

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
  echo "push failed — v$NEW is committed and tagged on local main; retry: git push origin main v$NEW" >&2
  exit 1
fi

echo "declared v$NEW ($TYPE, was v$CURRENT) @ $(git -C "$MAIN" rev-parse --short HEAD) · tagged v$NEW · pushed main + v$NEW"
echo "next: /commit deploy (image) · /commit notes $NEW (Directus release note)"
