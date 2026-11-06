#!/bin/bash
# Ovidius automation — /commit merge: squash-deliver the current worktree
# branch onto main as ONE commit. Ovidius composes the delivery message (passed
# in as a file); this script owns all git mechanics.
#
# The branch LIVES ON after delivery (nothing is deleted); each /commit merge
# squashes whatever the branch accumulated since the last delivery.
#
# Unlike tecraft there is no candidate-tag option: scripts/release.sh builds
# the CHANGELOG from `git describe --tags`, so any extra tag on main would cut
# the next release's change list short.
#
# Main is NOT pushed here — that is /commit push.
#
# Usage: ovidius-merge.sh <message-file>
set -euo pipefail

MSG_FILE=${1:?"usage: ovidius-merge.sh <message-file>"}
MSG_PATH=$(cd "$(dirname "$MSG_FILE")" && pwd)/$(basename "$MSG_FILE")
[[ -s "$MSG_PATH" ]] || { echo "message file is missing or empty: $MSG_FILE" >&2; exit 1; }

BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$BRANCH" == "main" || "$BRANCH" == "HEAD" ]]; then
  echo "run /commit merge from a worktree branch (current: $BRANCH)" >&2
  exit 1
fi
if [[ -n "$(git status --porcelain)" ]]; then
  echo "branch '$BRANCH' has uncommitted changes — /commit them first" >&2
  exit 1
fi

# shellcheck source=ovidius-lib.sh
source "$(dirname "$0")/ovidius-lib.sh"
ovidius_main_checkout

if ! git -C "$MAIN" merge --squash "$BRANCH" >/dev/null; then
  git -C "$MAIN" reset -q --hard HEAD
  echo "squash of $BRANCH onto main conflicts — merge main into $BRANCH, resolve, /commit, then retry" >&2
  exit 1
fi

if git -C "$MAIN" diff --cached --quiet; then
  echo "nothing to deliver: main already contains everything on $BRANCH"
  exit 0
fi

git -C "$MAIN" commit -q --no-verify -F "$MSG_PATH"
HASH=$(git -C "$MAIN" rev-parse --short HEAD)

echo "delivered $BRANCH -> main @ $HASH (local; publish with /commit push)"
