#!/bin/bash
# Create backup of all sbozh.me data
# Usage: ./create-backup.sh
#
# Creates a compressed archive containing:
# - PostgreSQL dumps (Directus and Umami databases)
# - Data directories (postgres, directus, umami-postgres)
#
# Retention: keeps last 7 backups

set -e

BACKUP_DIR="/mnt/sbozh-me-data/backups"
APP_DIR="/opt/sbozh-me"
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_NAME="sbozh-me-backup-$DATE"

echo "=== sbozh.me Backup ==="
echo "Date: $(date)"
echo ""

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Dump PostgreSQL databases
echo "Dumping PostgreSQL databases..."

# Dump Directus database
echo "  Dumping Directus database..."
docker compose -f "$APP_DIR/docker-compose.yaml" exec -T database \
  pg_dumpall -U directus > "$BACKUP_DIR/$BACKUP_NAME-directus-db.sql"

# Dump Umami database
echo "  Dumping Umami database..."
docker compose -f "$APP_DIR/docker-compose.yaml" exec -T umami-db \
  pg_dumpall -U umami > "$BACKUP_DIR/$BACKUP_NAME-umami-db.sql"

DIRECTUS_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_NAME-directus-db.sql" | cut -f1)
UMAMI_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_NAME-umami-db.sql" | cut -f1)
echo "  Directus database: $DIRECTUS_SIZE"
echo "  Umami database: $UMAMI_SIZE"

# Compress data directories
echo "Compressing data directories..."
tar -czf "$BACKUP_DIR/$BACKUP_NAME-data.tar.gz" \
  -C /mnt/sbozh-me-data \
  --exclude='backups' \
  postgres directus umami-postgres 2>/dev/null || true

DATA_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_NAME-data.tar.gz" | cut -f1)
echo "  Data archive: $DATA_SIZE"

# Create final archive with all files
echo "Creating final archive..."
tar -czf "$BACKUP_DIR/$BACKUP_NAME-full.tar.gz" \
  -C "$BACKUP_DIR" \
  "$BACKUP_NAME-directus-db.sql" \
  "$BACKUP_NAME-umami-db.sql" \
  "$BACKUP_NAME-data.tar.gz"

FINAL_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_NAME-full.tar.gz" | cut -f1)

# Cleanup temp files
rm -f "$BACKUP_DIR/$BACKUP_NAME-directus-db.sql" \
      "$BACKUP_DIR/$BACKUP_NAME-umami-db.sql" \
      "$BACKUP_DIR/$BACKUP_NAME-data.tar.gz"

# Retention: keep last 7 backups
echo ""
echo "Applying retention policy (keeping last 7 backups)..."
DELETED=$(ls -t "$BACKUP_DIR"/*-full.tar.gz 2>/dev/null | tail -n +8 | wc -l)
ls -t "$BACKUP_DIR"/*-full.tar.gz 2>/dev/null | tail -n +8 | xargs -r rm
if [ "$DELETED" -gt 0 ]; then
  echo "  Deleted $DELETED old backup(s)"
fi

echo ""
echo "=== Backup Complete ==="
echo "File: $BACKUP_DIR/$BACKUP_NAME-full.tar.gz"
echo "Size: $FINAL_SIZE"
echo ""
echo "To download: rsync -avz server:$BACKUP_DIR/$BACKUP_NAME-full.tar.gz ~/backups/"
