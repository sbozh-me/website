#!/bin/bash
# Ovidius automation — /commit deploy: make sure ghcr carries the image for the
# version declared on main. If it exists, report and stop; otherwise build the
# exact tagged commit and push it.
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
# Switching the server stays a human step: make swv VERSION=X.Y.Z
#
# Usage: ovidius-deploy.sh
set -euo pipefail

IMAGE=ghcr.io/sbozh-me/website # mirrors IMAGE in the root Makefile
BUILD_HOST=tecraft
PROD_HOST=sbozhme

# shellcheck source=ovidius-lib.sh
source "$(dirname "$0")/ovidius-lib.sh"

VERSION=$(git show main:apps/web/package.json | node -e "process.stdout.write(JSON.parse(require('fs').readFileSync(0,'utf8')).version)")
TAG="v$VERSION"
if ! git rev-parse -q --verify "refs/tags/$TAG" >/dev/null; then
  echo "main declares $VERSION but tag $TAG does not exist — run /commit push first" >&2
  exit 1
fi

PROD=$(ssh -n -o ConnectTimeout=10 "$PROD_HOST" "grep -oE '^WEB_IMAGE_TAG=.*' /opt/sbozh-me/.env | cut -d= -f2" 2>/dev/null || true)
echo "main declares $VERSION · production runs ${PROD:-unknown}"

if ssh -n -o ConnectTimeout=10 "$BUILD_HOST" "docker manifest inspect $IMAGE:$VERSION >/dev/null 2>&1"; then
  echo "ghcr is current: $IMAGE:$VERSION already exists — nothing to build"
else
  ENV_LOCAL="$PRIMARY/apps/web/.env.local"
  if [[ ! -f "$ENV_LOCAL" ]]; then
    echo "$ENV_LOCAL is missing — refusing to build an image whose Directus pages would prerender empty" >&2
    exit 1
  fi

  ovidius_tmp_tree "$TAG" --detach
  TREE=$TMP_TREE
  cp "$ENV_LOCAL" "$TREE/apps/web/.env.local"

  echo "ghcr is outdated: building $IMAGE:$VERSION from $TAG on $BUILD_HOST (takes minutes)..."
  docker --host "ssh://$BUILD_HOST" build --platform linux/amd64 \
    -t "$IMAGE:$VERSION" -t "$IMAGE:latest" -f "$TREE/apps/web/Dockerfile" "$TREE"
  ssh -n "$BUILD_HOST" "docker push $IMAGE:$VERSION && docker push $IMAGE:latest"
  # tecraft's disk runs ~80% full — don't leave the image behind.
  ssh -n "$BUILD_HOST" "docker rmi $IMAGE:$VERSION $IMAGE:latest >/dev/null" || true
  echo "pushed $IMAGE:$VERSION (and :latest)"
fi

# Compose/env changes need the infra deploy, not just an image switch.
if [[ -n "$PROD" && "$PROD" != "$VERSION" ]] && git rev-parse -q --verify "refs/tags/v$PROD" >/dev/null; then
  if ! git diff --quiet "v$PROD" "$TAG" -- deploy/production/website; then
    echo "note: deploy/production/website changed since v$PROD — run make deploy-infra as well"
  fi
fi

if [[ "$PROD" == "$VERSION" ]]; then
  echo "production already runs $VERSION"
else
  echo "switch the server with: make swv VERSION=$VERSION"
fi
