#!/bin/sh
set -e

APP_DIR="/opt/sbozh-me"
MARKER_FILE="/directus/uploads/.init-completed"

echo "=== Init Script ==="
echo "Working directory: $(pwd)"
echo "Snapshots available:"
ls -la /snapshots/ 2>/dev/null || echo "  No snapshots found!"

# Get container names dynamically
DIRECTUS_CONTAINER=$(docker ps --filter "name=directus" --filter "status=running" --format "{{.Names}}" | grep -v init | head -1)
DATABASE_CONTAINER=$(docker ps --filter "name=database" --filter "status=running" --format "{{.Names}}" | head -1)

echo "Directus container: $DIRECTUS_CONTAINER"
echo "Database container: $DATABASE_CONTAINER"

if [ -z "$DIRECTUS_CONTAINER" ]; then
    echo "Error: Directus container not found!"
    exit 1
fi

# Check if init was already completed
if docker exec "$DIRECTUS_CONTAINER" test -f "$MARKER_FILE" 2>/dev/null; then
    echo "Init already completed (marker file exists). Skipping."
    exit 0
fi

echo ""
echo "=== First run detected ==="

# --- Directus Schema ---
echo ""
echo "--- Applying Directus Schema ---"

# Create snapshots directory in container
docker exec "$DIRECTUS_CONTAINER" mkdir -p /directus/snapshots

# Copy snapshot to container
echo "Copying schema snapshot..."
docker cp /snapshots/blog-schema.yaml "$DIRECTUS_CONTAINER":/directus/snapshots/blog-schema.yaml

# Apply schema
echo "Applying schema..."
docker exec "$DIRECTUS_CONTAINER" npx directus schema apply --yes /directus/snapshots/blog-schema.yaml || {
    echo "Warning: Schema apply failed (might already exist)"
}

echo "Directus schema applied!"

# --- Create marker file ---
echo ""
echo "Creating marker file..."
docker exec "$DIRECTUS_CONTAINER" touch "$MARKER_FILE"

echo ""
echo "=== Init completed successfully! ==="
