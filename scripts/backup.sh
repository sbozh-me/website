#!/usr/bin/env bash
# Backup sbozh.me production: Directus (DB + uploads), Umami analytics (DB),
# and server config. Produces dated .zip files in ./backups ready for cloud upload.
#
# Usage: ./scripts/backup.sh [--no-config]
set -euo pipefail

SSH_HOST="${SSH_HOST:-sbozhme}"
APP_DIR="/opt/sbozh-me"
UPLOADS_DIR="/mnt/sbozh-me-data/directus/uploads"
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="${BACKUP_DIR:-backups}"
STAGING="$BACKUP_DIR/.staging-$STAMP"

WITH_CONFIG=true
[[ "${1:-}" == "--no-config" ]] && WITH_CONFIG=false

cleanup() { rm -rf "$STAGING"; }
trap cleanup EXIT

mkdir -p "$STAGING/directus" "$STAGING/umami"

remote() { ssh "$SSH_HOST" "$@"; }
compose_exec() { remote "cd $APP_DIR && docker compose exec -T $1 sh -c '$2'"; }

echo "==> Dumping Directus database..."
compose_exec database 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists' \
  > "$STAGING/directus/directus-db.sql"
[[ -s "$STAGING/directus/directus-db.sql" ]] || { echo "ERROR: Directus dump is empty" >&2; exit 1; }

echo "==> Downloading Directus uploads ($(remote "du -sh $UPLOADS_DIR | cut -f1"))..."
remote "tar -C $(dirname "$UPLOADS_DIR") -cf - $(basename "$UPLOADS_DIR")" \
  | tar -xf - -C "$STAGING/directus"

echo "==> Dumping Umami database..."
compose_exec umami-db 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists' \
  > "$STAGING/umami/umami-db.sql"
[[ -s "$STAGING/umami/umami-db.sql" ]] || { echo "ERROR: Umami dump is empty" >&2; exit 1; }

cat > "$STAGING/directus/RESTORE.md" <<'EOF'
# Restore Directus

1. Start the stack: `cd /opt/sbozh-me && docker compose up -d database`
2. Restore DB: `docker compose exec -T database psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < directus-db.sql`
   (run psql inside the container; the dump includes DROP/CREATE for all objects)
3. Restore uploads: copy `uploads/` to `/mnt/sbozh-me-data/directus/uploads`
4. `docker compose up -d directus`
EOF

cat > "$STAGING/umami/RESTORE.md" <<'EOF'
# Restore Umami

1. `cd /opt/sbozh-me && docker compose up -d umami-db`
2. `docker compose exec -T umami-db psql -U umami -d umami < umami-db.sql`
3. `docker compose up -d umami`
EOF

if $WITH_CONFIG; then
  echo "==> Copying server config (.env + compose) — CONTAINS SECRETS..."
  mkdir -p "$STAGING/config"
  remote "cat $APP_DIR/.env" > "$STAGING/config/.env"
  remote "cat $APP_DIR/docker-compose.yaml" > "$STAGING/config/docker-compose.yaml"
fi

echo "==> Creating zip archives..."
mkdir -p "$BACKUP_DIR"
(cd "$STAGING/directus" && zip -rq "../../sbozhme-directus-$STAMP.zip" .)
(cd "$STAGING/umami" && zip -rq "../../sbozhme-umami-$STAMP.zip" .)
if $WITH_CONFIG; then
  (cd "$STAGING/config" && zip -rq "../../sbozhme-config-$STAMP.zip" .env docker-compose.yaml)
fi

echo
echo "Backup complete:"
ls -lh "$BACKUP_DIR"/sbozhme-*-"$STAMP".zip
$WITH_CONFIG && echo
$WITH_CONFIG && echo "NOTE: sbozhme-config-$STAMP.zip contains secrets (.env)." \
  "Encrypt it before uploading to cloud storage, or use --no-config to skip it."
