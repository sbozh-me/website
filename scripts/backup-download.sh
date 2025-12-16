#!/bin/bash
# Download backup from production server to local machine
# Usage: ./scripts/backup-download.sh [server-alias]
#
# Prerequisites:
# - SSH access to server (via ~/.ssh/config alias or direct hostname)
# - rsync installed locally
#
# Default server alias: pifagor (configure in ~/.ssh/config)

set -e

SERVER="${1:-sbozhme}"
LOCAL_DIR="$HOME/backups/sbozh-me"

echo "=== sbozh.me Backup Download ==="
echo "Server: $SERVER"
echo "Local:  $LOCAL_DIR"
echo ""

# Create local backup directory
mkdir -p "$LOCAL_DIR"

# Test SSH connection
echo "Testing SSH connection..."
if ! ssh -q "$SERVER" exit; then
  echo "Error: Cannot connect to $SERVER"
  echo "Make sure you have SSH access configured"
  exit 1
fi

# Create backup on server
echo ""
echo "Creating backup on server..."
ssh "$SERVER" '/opt/sbozh-me/scripts/create-backup.sh'

# Find latest backup
echo ""
echo "Finding latest backup..."
LATEST=$(ssh "$SERVER" 'ls -t /mnt/sbozh-me-data/backups/*-full.tar.gz 2>/dev/null | head -1')

if [ -z "$LATEST" ]; then
  echo "Error: No backup found on server"
  exit 1
fi

BACKUP_NAME=$(basename "$LATEST")
echo "Found: $BACKUP_NAME"

# Check if already downloaded
if [ -f "$LOCAL_DIR/$BACKUP_NAME" ]; then
  echo "Backup already exists locally: $LOCAL_DIR/$BACKUP_NAME"
  read -p "Download again? [y/N] " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Skipping download"
    exit 0
  fi
fi

# Download backup
echo ""
echo "Downloading backup..."
rsync -avz --progress "$SERVER:$LATEST" "$LOCAL_DIR/"

# Show result
FINAL_SIZE=$(du -h "$LOCAL_DIR/$BACKUP_NAME" | cut -f1)

echo ""
echo "=== Download Complete ==="
echo "File: $LOCAL_DIR/$BACKUP_NAME"
echo "Size: $FINAL_SIZE"
echo ""
echo "To restore:"
echo "  tar -xzf $LOCAL_DIR/$BACKUP_NAME"
echo "  # Contains: *-db.sql (pg_dumpall) + *-data.tar.gz (files)"
