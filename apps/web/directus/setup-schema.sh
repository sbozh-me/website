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

# Check if posts already exist before seeding
echo "Checking for existing posts..."
TOKEN=$(curl -s -X POST http://localhost:8055/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@sbozh.me","password":"directus123"}' | jq -r '.data.access_token')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo "Warning: Could not authenticate to check for existing posts"
    echo "Running seed data import..."
    ./seed-data.sh
else
    POST_COUNT=$(curl -s "http://localhost:8055/items/posts?limit=0&meta=total_count" \
        -H "Authorization: Bearer $TOKEN" | jq -r '.meta.total_count // 0')

    if [ "$POST_COUNT" -gt 0 ]; then
        echo "Found $POST_COUNT existing post(s). Skipping seed data import."
        echo ""
        echo "To re-seed data, manually run: ./seed-data.sh"
    else
        echo "No posts found. Running seed data import..."
        ./seed-data.sh
    fi
fi
