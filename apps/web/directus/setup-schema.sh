#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "Setting up Blog Schema..."

# Check if Directus container is running
if ! docker compose ps directus | grep -q "Up"; then
    echo "Error: Directus container is not running"
    echo "Run: docker compose up -d"
    exit 1
fi

# Wait for Directus to be ready
echo "Waiting for Directus to be ready..."
until curl -s http://localhost:8055/server/health | grep -q '"status":"ok"'; do
    echo "  Directus is not ready yet, waiting..."
    sleep 2
done
echo "Directus is ready!"

# Copy snapshot to container
echo ""
echo "Copying schema snapshot to container..."
docker compose exec -T directus mkdir -p /directus/snapshots
docker compose cp ./snapshots/blog-schema.yaml directus:/directus/snapshots/blog-schema.yaml

# Apply schema snapshot
echo "Applying schema snapshot..."
docker compose exec -T directus npx directus schema apply --yes /directus/snapshots/blog-schema.yaml 2>&1 | grep -v "Update available"

echo ""
echo "Schema applied successfully!"
echo ""

# Run seed data script
echo "Running seed data import..."
./seed-data.sh
