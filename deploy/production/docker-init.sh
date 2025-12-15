#!/bin/sh
set -e

DIRECTUS_CONTAINER="sbozh-me-production-directus-1"
MARKER_FILE="/directus/uploads/.schema-applied"

echo "=== Directus Init Script ==="

# Wait for Directus container to be available
echo "Waiting for Directus container..."
until docker inspect "$DIRECTUS_CONTAINER" >/dev/null 2>&1; do
    echo "  Container not found, waiting..."
    sleep 2
done

# Check if schema was already applied (marker file exists in persistent volume)
if docker exec "$DIRECTUS_CONTAINER" test -f "$MARKER_FILE" 2>/dev/null; then
    echo "Schema already applied (marker file exists). Skipping."
    exit 0
fi

echo "First run detected. Applying schema..."

# Copy snapshot to container
echo "Copying schema snapshot..."
docker cp /snapshots/blog-schema.yaml "$DIRECTUS_CONTAINER":/directus/snapshots/blog-schema.yaml

# Apply schema
echo "Applying schema..."
docker exec "$DIRECTUS_CONTAINER" npx directus schema apply --yes /directus/snapshots/blog-schema.yaml

# Create marker file to prevent re-running
echo "Creating marker file..."
docker exec "$DIRECTUS_CONTAINER" touch "$MARKER_FILE"

echo "=== Schema applied successfully! ==="
