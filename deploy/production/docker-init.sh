#!/bin/sh
set -e

APP_DIR="/opt/sbozh-me"
DIRECTUS_MARKER_FILE="/directus/uploads/.init-completed"

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

# --- Umami Database Initialization ---
echo ""
echo "=== Umami Database Check ==="

# Check if database container is available
if [ -z "$DATABASE_CONTAINER" ]; then
    echo "Warning: Database container not found, skipping Umami initialization"
elif [ -z "$UMAMI_DB_PASSWORD" ]; then
    echo "Warning: UMAMI_DB_PASSWORD not set, skipping Umami database initialization"
else
    UMAMI_USER="${UMAMI_DB_USER:-umami}"
    UMAMI_DB="${UMAMI_DB_NAME:-umami}"

    # Check if umami user exists in PostgreSQL
    UMAMI_USER_EXISTS=$(docker exec "$DATABASE_CONTAINER" psql -U "$DB_USER" -d "$DB_DATABASE" -tAc "SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = '$UMAMI_USER'" 2>/dev/null)

    if [ "$UMAMI_USER_EXISTS" = "1" ]; then
        echo "Umami user already exists. Skipping."
    else
        echo "Initializing Umami database..."

        # Create umami user and database
        docker exec "$DATABASE_CONTAINER" psql -U "$DB_USER" -d "$DB_DATABASE" <<EOSQL
-- Create umami user
CREATE USER $UMAMI_USER WITH PASSWORD '$UMAMI_DB_PASSWORD';

-- Create umami database
CREATE DATABASE $UMAMI_DB OWNER $UMAMI_USER;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $UMAMI_DB TO $UMAMI_USER;
EOSQL

        echo "Umami database initialized!"
    fi
fi

# --- Directus Schema Initialization ---
echo ""
echo "=== Directus Schema Check ==="

if docker exec "$DIRECTUS_CONTAINER" test -f "$DIRECTUS_MARKER_FILE" 2>/dev/null; then
    echo "Directus schema already applied (marker file exists). Skipping."
    exit 0
fi

echo ""
echo "=== First Directus run detected ==="

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
echo "Creating Directus marker file..."
docker exec "$DIRECTUS_CONTAINER" touch "$DIRECTUS_MARKER_FILE"

echo ""
echo "=== Init completed successfully! ==="
