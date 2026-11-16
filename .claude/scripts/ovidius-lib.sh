#!/bin/bash
# Shared plumbing for the ovidius-{merge,push,deploy}.sh scripts. Sourced, not
# run. Ovidius composes text; these scripts own every piece of git mechanics.
#
# The website differs from tecraft in one way that matters: `main` is often
# checked out NOWHERE (the primary checkout sits on a feature branch). So when
# no worktree holds main, the scripts borrow a temporary worktree for it and
# remove it on exit, instead of refusing.

# The primary checkout (first worktree) — holds the git-ignored
# apps/web/.env.local that image builds need.
PRIMARY=$(git worktree list --porcelain | awk '/^worktree /{print $2; exit}')

_OVIDIUS_TMP_TREES=()

ovidius_cleanup() {
  local tree
  for tree in "${_OVIDIUS_TMP_TREES[@]+"${_OVIDIUS_TMP_TREES[@]}"}"; do
    git worktree remove --force "$tree" >/dev/null 2>&1 || true
    rm -rf "$(dirname "$tree")"
  done
}
trap ovidius_cleanup EXIT

# Borrow a temporary worktree; sets TMP_TREE. Call it directly, never inside
# $(...) — a subshell would lose the cleanup registration.
# Usage: ovidius_tmp_tree <commit-ish> [--detach]
ovidius_tmp_tree() {
  local ref=$1 detach=${2:-}
  local tree
  tree="$(mktemp -d)/main"
  if [[ "$detach" == "--detach" ]]; then
    git worktree add -q --detach "$tree" "$ref"
  else
    git worktree add -q "$tree" "$ref"
  fi
  _OVIDIUS_TMP_TREES+=("$tree")
  TMP_TREE=$tree
}

# Sets MAIN to a clean checkout of the main branch — the existing one if some
# worktree holds main, otherwise a temporary one.
ovidius_main_checkout() {
  MAIN=$(git worktree list --porcelain | awk '/^worktree /{w=$2} /^branch refs\/heads\/main$/{print w}')
  if [[ -n "$MAIN" ]]; then
    if [[ -n "$(git -C "$MAIN" status --porcelain)" ]]; then
      echo "main checkout at $MAIN is dirty — another session may be mid-work; resolve first" >&2
      exit 1
    fi
    echo "using main checkout at $MAIN"
  else
    ovidius_tmp_tree main
    MAIN=$TMP_TREE
    echo "main is checked out nowhere — using temporary worktree $MAIN"
  fi
}

# /commit push only. A version is declared in the main checkout itself, by a
# session that sits on main there: never from a worktree, borrowed or not.
# Sets MAIN. Untracked files don't block (the release stages its own files by
# name); a modified or staged tracked file does, since it may be another
# session's half-done work and the coverage gate would test it.
ovidius_release_checkout() {
  local here branch dirty
  here=$(git rev-parse --show-toplevel)
  branch=$(git -C "$here" rev-parse --abbrev-ref HEAD)
  if [[ "$branch" != "main" ]]; then
    echo "/commit push runs only on main, and this session is on '$branch' — deliver the branch with /commit merge, then push from the main checkout" >&2
    exit 1
  fi
  if [[ ! "$here" -ef "$PRIMARY" ]]; then
    echo "/commit push runs only in the main checkout ($PRIMARY), never in a worktree ($here)" >&2
    exit 1
  fi
  dirty=$(git -C "$here" status --porcelain --untracked-files=no)
  if [[ -n "$dirty" ]]; then
    echo "main has uncommitted changes to tracked files — commit them first (another session may be mid-work):" >&2
    sed 's/^/  /' <<<"$dirty" >&2
    exit 1
  fi
  MAIN=$here
}

# Talk to origin through gh's credential helper: plain HTTPS via osxkeychain
# fails from a non-interactive shell. Usage: ovidius_git_remote <dir> fetch|push ...
ovidius_git_remote() {
  local dir=$1
  shift
  if command -v gh >/dev/null 2>&1; then
    git -C "$dir" -c credential.helper= -c 'credential.helper=!gh auth git-credential' "$@"
  else
    git -C "$dir" "$@"
  fi
}
