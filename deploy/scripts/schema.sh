#!/usr/bin/env bash
# Directus schema migration — pull, snapshot, diff and apply, WITHOUT dropping
# the database. Ported from tecraft's deploy/scripts/schema.sh.
#
# A schema change is a MIGRATION, never a re-creation. docker-init.sh applies
# the snapshot only on the very first run (marker file), so every later schema
# change goes through this script. `directus schema apply` alters the schema
# in place and leaves rows alone.
#
#   ./deploy/scripts/schema.sh pull                 export live PROD → snapshot (read-only)
#   ./deploy/scripts/schema.sh snapshot             export live LOCAL → snapshot
#   ./deploy/scripts/schema.sh diff    [local|prod] what WOULD change
#   ./deploy/scripts/schema.sh apply   [local|prod] apply it (asks first on prod)
#
# `diff` is not decoration. `schema apply` syncs in BOTH directions: anything
# present in the target but absent from the snapshot is DROPPED, columns and
# their data included. Always read the diff before applying to production.
#
# Local and prod must run the same Directus version (both compose files pin
# it), or `schema apply` refuses the snapshot.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
# The tracked snapshot. docker-init.sh ships this one to production; the local
# copy feeds deploy/local/directus/setup-schema.sh and is kept identical.
SNAPSHOT="$REPO_ROOT/deploy/production/website/snapshots/blog-schema.yaml"
LOCAL_COPY="$REPO_ROOT/deploy/local/directus/snapshots/blog-schema.yaml"

LOCAL_CONTAINER="directus-directus-1"
SSH_HOST="${SSH_HOST:-sbozhme}"
APP_DIR="${APP_DIR:-/opt/sbozh-me}"
PROD_SERVICE="directus"

command="${1:-}"
target="${2:-local}"

die() { echo "error: $*" >&2; exit 1; }

# Run a directus CLI command in the right container, local or over ssh.
run_directus() {
  case "$target" in
    local)
      docker exec "$LOCAL_CONTAINER" npx directus "$@"
      ;;
    prod)
      # shellcheck disable=SC2029 # deliberate client-side expansion
      # -n: never read the caller's stdin, or ssh swallows the confirmation
      # line below and a piped `apply` silently aborts.
      ssh -n "$SSH_HOST" "cd $APP_DIR && docker compose exec -T $PROD_SERVICE npx directus $*"
      ;;
    *) die "unknown target '$target' (use local or prod)" ;;
  esac
}

copy_to_container() {
  case "$target" in
    local) docker cp "$SNAPSHOT" "$LOCAL_CONTAINER:/tmp/schema.yaml" ;;
    prod)
      scp "$SNAPSHOT" "$SSH_HOST:/tmp/schema.yaml"
      # shellcheck disable=SC2029
      ssh -n "$SSH_HOST" "cd $APP_DIR && docker compose cp /tmp/schema.yaml $PROD_SERVICE:/tmp/schema.yaml"
      ;;
  esac
}

sync_local_copy() {
  cp "$SNAPSHOT" "$LOCAL_COPY"
  echo "Wrote $SNAPSHOT (and $LOCAL_COPY)"
  echo
  echo "Review it before committing — especially any DELETION:"
  git -C "$REPO_ROOT" diff --stat -- "$SNAPSHOT"
}

case "$command" in
  pull)
    # Export the LIVE production schema over the tracked snapshot. Read-only
    # on the server. Run it before changing the schema locally, so the local
    # instance starts from what production actually has.
    # shellcheck disable=SC2029
    ssh -n "$SSH_HOST" "cd $APP_DIR && docker compose exec -T $PROD_SERVICE sh -c 'npx directus schema snapshot --yes /tmp/snapshot.yaml >/dev/null && cat /tmp/snapshot.yaml'" > "$SNAPSHOT.tmp"
    mv "$SNAPSHOT.tmp" "$SNAPSHOT"
    sync_local_copy
    ;;

  snapshot)
    # Export the LIVE local schema over the tracked snapshot. The snapshot is
    # generated, never hand-edited: Directus records ordering and metadata a
    # human will get subtly wrong, and a wrong snapshot DELETES things on the
    # next apply.
    [ "$target" = "local" ] || die "snapshot only runs against local (use pull for prod)"
    docker exec "$LOCAL_CONTAINER" npx directus schema snapshot --yes /tmp/snapshot.yaml
    docker cp "$LOCAL_CONTAINER:/tmp/snapshot.yaml" "$SNAPSHOT"
    sync_local_copy
    ;;

  diff)
    [ -f "$SNAPSHOT" ] || die "no snapshot at $SNAPSHOT"
    copy_to_container
    echo "=== What applying this snapshot to '$target' would change ==="
    # `apply --dry-run` is Directus' plan step (there is no `schema diff`
    # subcommand). "No changes" means the target already matches.
    run_directus schema apply --dry-run /tmp/schema.yaml
    ;;

  apply)
    [ -f "$SNAPSHOT" ] || die "no snapshot at $SNAPSHOT"
    copy_to_container

    echo "=== Pending changes on '$target' ==="
    run_directus schema apply --dry-run /tmp/schema.yaml
    echo

    if [ "$target" = "prod" ]; then
      echo "This alters the PRODUCTION schema in place."
      echo "Anything missing from the snapshot will be DROPPED, with its data."
      read -r -p "Type 'apply' to continue: " confirm
      [ "$confirm" = "apply" ] || die "aborted"
    fi

    run_directus schema apply --yes /tmp/schema.yaml

    # RESTART, always. Directus caches its schema in memory; a long-running
    # instance keeps serving the OLD schema and answers 403 for new fields.
    echo "Restarting Directus so it picks up the new schema..."
    case "$target" in
      local) docker restart "$LOCAL_CONTAINER" >/dev/null ;;
      prod)
        # shellcheck disable=SC2029
        ssh -n "$SSH_HOST" "cd $APP_DIR && docker compose restart $PROD_SERVICE"
        ;;
    esac

    echo "Applied to $target."
    ;;

  *)
    grep '^#' "$0" | sed 's/^# \{0,1\}//'
    exit 1
    ;;
esac
