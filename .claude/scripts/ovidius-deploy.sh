#!/bin/bash
# Ovidius automation — /commit deploy: put the version declared on main live.
# The last step of a release; /commit push did everything before it.
#
#   1. image   if ghcr lacks it, build the exact tagged commit and push it
#   2. infra   the server's docker-compose.yaml must be the tagged copy
#   3. switch  make swv VERSION=X.Y.Z (WEB_IMAGE_TAG, pull, up -d web)
#   4. verify  the web container runs the new image, https://sbozh.me is 200;
#              nothing after this happens unless both hold
#   5. mail    turn the subscriber mail on for the version's release note
#   6. check   Kagurame's links against the live site
#
# Every step is idempotent and says so when it has nothing to do, so a run
# that stopped halfway is simply run again.
#
# Why not `make push-web-image`: buildx pushes with the Mac's ghcr credentials,
# which ghcr denies. tecraft's Docker has a working ghcr login, so the image is
# built ON tecraft (docker --host ssh://tecraft) and pushed from there; the
# manifest check runs there too, for the same reason.
#
# The build context is a temporary worktree at tag vX.Y.Z, plus
# apps/web/.env.local copied from the primary checkout — without it `next
# build` cannot reach Directus and Directus-backed pages prerender empty.
#
# Usage: ovidius-deploy.sh [--no-mail]
#   --no-mail  leave this release's note unmailed
#
# Exit 3: the version is live, but the mail step did not go through.
set -euo pipefail

USAGE="usage: ovidius-deploy.sh [--no-mail]"
MAIL=1
for arg in "$@"; do
  case $arg in
    --no-mail) MAIL= ;;
    *) echo "$USAGE" >&2; exit 1 ;;
  esac
done

IMAGE=ghcr.io/sbozh-me/website # mirrors IMAGE in the root Makefile
BUILD_HOST=tecraft
PROD_HOST=sbozhme
PROD_DIR=/opt/sbozh-me
# By container name: on the server's shared network `web` is also renbg's.
PROD_CONTAINER=sbozh-me-production-web-1
SITE=https://sbozh.me
COMPOSE=deploy/production/website/docker-compose.yaml
# A build died with 2.4 GB free on tecraft and went through with 7.3 GB.
MIN_FREE_KB=$((6 * 1024 * 1024))

SCRIPTS=$(cd "$(dirname "$0")" && pwd)
ROOT=$(cd "$SCRIPTS/../.." && pwd)
# shellcheck source=ovidius-lib.sh
source "$SCRIPTS/ovidius-lib.sh"

VERSION=$(git show main:apps/web/package.json | node -e "process.stdout.write(JSON.parse(require('fs').readFileSync(0,'utf8')).version)")
TAG="v$VERSION"
if ! git rev-parse -q --verify "refs/tags/$TAG" >/dev/null; then
  echo "main declares $VERSION but tag $TAG does not exist — run /commit push first" >&2
  exit 1
fi

running_image() {
  ssh -n -o ConnectTimeout=10 "$PROD_HOST" "docker inspect $PROD_CONTAINER --format '{{.Config.Image}}'" 2>/dev/null || true
}
free_kb() {
  ssh -n -o ConnectTimeout=10 "$BUILD_HOST" "df -Pk / | awk 'NR==2{print \$4}'"
}

RUNNING=$(running_image)
echo "main declares $VERSION · production runs ${RUNNING:-unknown}"

# --- 1. image ---------------------------------------------------------------
if ssh -n -o ConnectTimeout=10 "$BUILD_HOST" "docker manifest inspect $IMAGE:$VERSION >/dev/null 2>&1"; then
  echo "ghcr is current: $IMAGE:$VERSION already exists — nothing to build"
else
  ENV_LOCAL="$PRIMARY/apps/web/.env.local"
  if [[ ! -f "$ENV_LOCAL" ]]; then
    echo "$ENV_LOCAL is missing — refusing to build an image whose Directus pages would prerender empty" >&2
    exit 1
  fi

  # tecraft is the tecraft.cz production host and its disk runs full. Only
  # this project's leftover images that ghcr also has are ours to drop.
  FREE=$(free_kb)
  if ((FREE < MIN_FREE_KB)); then
    for tag in $(ssh -n "$BUILD_HOST" "docker images $IMAGE --format '{{.Tag}}'" | grep -v '<none>' || true); do
      if ssh -n "$BUILD_HOST" "docker manifest inspect $IMAGE:$tag >/dev/null 2>&1 && docker rmi $IMAGE:$tag >/dev/null 2>&1"; then
        echo "removed leftover $IMAGE:$tag from $BUILD_HOST (ghcr has it)"
      fi
    done
    FREE=$(free_kb)
  fi
  if ((FREE < MIN_FREE_KB)); then
    echo "$BUILD_HOST has $((FREE / 1024 / 1024)) GB free and a build needs $((MIN_FREE_KB / 1024 / 1024)) — it is the tecraft.cz production host: decide with the author what may go, then run /commit deploy again" >&2
    exit 1
  fi

  ovidius_tmp_tree "$TAG" --detach
  TREE=$TMP_TREE
  cp "$ENV_LOCAL" "$TREE/apps/web/.env.local"

  echo "ghcr is outdated: building $IMAGE:$VERSION from $TAG on $BUILD_HOST (takes minutes)..."
  docker --host "ssh://$BUILD_HOST" build --platform linux/amd64 \
    -t "$IMAGE:$VERSION" -t "$IMAGE:latest" -f "$TREE/apps/web/Dockerfile" "$TREE"
  ssh -n "$BUILD_HOST" "docker push $IMAGE:$VERSION && docker push $IMAGE:latest"
  # Don't leave the image behind on tecraft's disk.
  ssh -n "$BUILD_HOST" "docker rmi $IMAGE:$VERSION $IMAGE:latest >/dev/null" || true
  echo "pushed $IMAGE:$VERSION (and :latest)"
fi

# --- 2–4. infra, switch, verify ---------------------------------------------
if [[ "$RUNNING" == "$IMAGE:$VERSION" ]]; then
  echo "production already runs $VERSION — nothing to switch"
else
  # A new image on an old compose file can miss an env var or a service.
  # make deploy-infra is not run from here: it overwrites the server .env
  # with the local copy, which wiped two secrets on 2026-11-10.
  if ! ssh -n -o ConnectTimeout=10 "$PROD_HOST" "cat $PROD_DIR/docker-compose.yaml" | diff -q - <(git show "$TAG:$COMPOSE") >/dev/null; then
    echo "the server's docker-compose.yaml differs from $COMPOSE at $TAG — not switching" >&2
    LOCAL_ENV="$PRIMARY/deploy/production/website/.env"
    if [[ -f "$LOCAL_ENV" ]]; then
      # Key names only, never values.
      MISSING=$(comm -23 \
        <(ssh -n "$PROD_HOST" "grep -oE '^[A-Za-z_][A-Za-z0-9_]*' $PROD_DIR/.env | sort -u") \
        <(grep -oE '^[A-Za-z_][A-Za-z0-9_]*' "$LOCAL_ENV" | sort -u) | paste -sd' ' -)
      if [[ -n "$MISSING" ]]; then
        echo "make deploy-infra would WIPE these server .env keys, which the local deploy .env lacks: $MISSING" >&2
      else
        echo "the local deploy .env has every key the server has (names only, values not compared)" >&2
      fi
    fi
    echo "bring the server's compose file up to $TAG (make deploy-infra, or copy the file and recreate what changed), then run /commit deploy again" >&2
    exit 1
  fi
  echo "infra is current: the server's docker-compose.yaml matches $TAG"

  make -C "$ROOT" swv VERSION="$VERSION"
fi

# Verified on every run, also when there was nothing to switch: a run that
# stopped here last time must not go on to the mail unchecked.
NOW_RUNS=
CODE=
for _ in $(seq 1 30); do
  NOW_RUNS=$(running_image)
  CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$SITE" || true)
  [[ "$NOW_RUNS" == "$IMAGE:$VERSION" && "$CODE" == "200" ]] && break
  sleep 4
done
if [[ "$NOW_RUNS" != "$IMAGE:$VERSION" || "$CODE" != "200" ]]; then
  echo "not live: the web container runs ${NOW_RUNS:-nothing} and $SITE answers ${CODE:-nothing} — no mail sent" >&2
  exit 1
fi
echo "live: $SITE runs $VERSION and answers 200"

# Other infra files (nginx template, server scripts, snapshots) ride on
# make deploy-infra and stop nothing here.
OLD=${RUNNING##*:}
if [[ -n "$OLD" && "$OLD" != "$VERSION" ]] && git rev-parse -q --verify "refs/tags/v$OLD" >/dev/null; then
  CHANGED=$(git diff --name-only "v$OLD" "$TAG" -- deploy/production/website ":!$COMPOSE" | paste -sd' ' -)
  [[ -z "$CHANGED" ]] || echo "note: infra files besides the compose file changed since v$OLD (make deploy-infra applies them): $CHANGED"
fi

# --- 5. mail ----------------------------------------------------------------
MAILED=1
if [[ -n "$MAIL" ]]; then
  node "$SCRIPTS/livius-publish.ts" mail "$VERSION" || MAILED=
else
  echo "mail skipped (--no-mail): the $VERSION note stays unmailed"
fi

# --- 6. Kagurame ------------------------------------------------------------
node "$SCRIPTS/plautus.ts" check --live || echo "note: one of Kagurame's links doesn't answer on sbozh.me (above)"

if [[ -z "$MAILED" ]]; then
  echo "$VERSION is live, but its release note was not mailed (above) — once fixed: node .claude/scripts/livius-publish.ts mail $VERSION" >&2
  exit 3
fi
echo "deployed $VERSION"
