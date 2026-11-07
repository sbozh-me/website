#!/usr/bin/env bash
# Directus flows as code. `directus schema snapshot` does not export flows or
# operations, so they live in deploy/directus/flows/*.json and are upserted by
# id through the API: re-running is safe, and edits made in the admin app to
# these flows are overwritten. Flows not in the repo are left alone.
#
#   ./deploy/scripts/flows.sh plan  [local|prod]   show what would change
#   ./deploy/scripts/flows.sh apply [local|prod]   upsert them (asks first on prod)
#   ./deploy/scripts/flows.sh backfill [local|prod]  once, before the flows go live:
#       mark every already-published post/release note as announced (asks first on prod)
#
# apply.mjs runs inside the Directus container (it has node), so neither this
# machine nor the server needs jq or curl tricks.
#
# Local token: DIRECTUS_TOKEN from the environment, else from apps/web/.env.local
# of the main checkout. Prod token: DIRECTUS_TOKEN from the server's .env.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
FLOWS_DIR="$REPO_ROOT/deploy/directus/flows"

LOCAL_CONTAINER="directus-directus-1"
SSH_HOST="${SSH_HOST:-sbozhme}"
APP_DIR="${APP_DIR:-/opt/sbozh-me}"

command="${1:-}"
target="${2:-local}"

die() { echo "error: $*" >&2; exit 1; }

mode=flows
case "$command" in
  plan) dry_run=1 ;;
  apply) dry_run=0 ;;
  backfill-plan) dry_run=1; mode=backfill ;;
  backfill) dry_run=0; mode=backfill ;;
  *) die "usage: $0 plan|apply|backfill-plan|backfill [local|prod]" ;;
esac

# All flow files merged into one JSON array, passed as one env var
flows_json="$(node -e '
  const fs = require("fs"), path = require("path");
  const dir = process.argv[1];
  const flows = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort()
    .flatMap((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));
  process.stdout.write(JSON.stringify(flows));
' "$FLOWS_DIR")"

case "$target" in
  local)
    token="${DIRECTUS_TOKEN:-}"
    if [ -z "$token" ]; then
      main_checkout="$(git -C "$REPO_ROOT" worktree list --porcelain | sed -n '1s/^worktree //p')"
      env_file="$main_checkout/apps/web/.env.local"
      [ -f "$env_file" ] || die "no DIRECTUS_TOKEN and no $env_file"
      token="$(sed -n 's/^DIRECTUS_TOKEN=//p' "$env_file" | tr -d '"')"
    fi
    docker exec -i -e DIRECTUS_TOKEN="$token" -e FLOWS_JSON="$flows_json" -e DRY_RUN="$dry_run" -e MODE="$mode" \
      "$LOCAL_CONTAINER" node --input-type=module - < "$FLOWS_DIR/apply.mjs"
    ;;
  prod)
    if [ "$dry_run" = 0 ]; then
      if [ "$mode" = backfill ]; then "$0" backfill-plan prod; else "$0" plan prod; fi
      read -r -p "Apply this to PRODUCTION? [y/N] " answer
      [ "$answer" = "y" ] || die "aborted"
    fi
    flows_file="$(mktemp)"
    trap 'rm -f "$flows_file"' EXIT
    printf '%s' "$flows_json" > "$flows_file"
    scp -q "$flows_file" "$SSH_HOST:/tmp/flows.json"
    scp -q "$FLOWS_DIR/apply.mjs" "$SSH_HOST:/tmp/flows-apply.mjs"
    # shellcheck disable=SC2029 # $DIRECTUS_TOKEN expands on the server, from its .env
    ssh -n "$SSH_HOST" "cd $APP_DIR && set -a && . ./.env && set +a && \
      docker compose exec -T -e DIRECTUS_TOKEN=\"\$DIRECTUS_TOKEN\" -e FLOWS_JSON=\"\$(cat /tmp/flows.json)\" \
        -e DRY_RUN=$dry_run -e MODE=$mode directus node --input-type=module - < /tmp/flows-apply.mjs; \
      status=\$?; rm -f /tmp/flows.json /tmp/flows-apply.mjs; exit \$status"
    ;;
  *) die "unknown target '$target' (use local or prod)" ;;
esac
