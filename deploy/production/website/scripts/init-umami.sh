#!/bin/bash
# Initialize Umami database on existing server
# Usage: ./init-umami.sh
#
# This script is for servers that already have PostgreSQL running.
# For new servers, the init script runs automatically on first startup.

set -e

APP_DIR="/opt/sbozh-me"
ENV_FILE="$APP_DIR/.env"

# Check if .env exists
if [ ! -f "$ENV_FILE" ]; then
    echo "Error: $ENV_FILE not found"
    exit 1
fi

# Source environment variables
source "$ENV_FILE"

# Check required variables
if [ -z "$UMAMI_DB_PASSWORD" ]; then
    echo "Error: UMAMI_DB_PASSWORD not set in .env"
    exit 1
fi

UMAMI_USER="${UMAMI_DB_USER:-umami}"
UMAMI_DB="${UMAMI_DB_NAME:-umami}"

echo "Creating Umami database and user..."

docker compose -f "$APP_DIR/docker-compose.yaml" exec -T database psql -U "$DB_USER" -d "$DB_DATABASE" <<EOSQL
-- Create umami user if not exists
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$UMAMI_USER') THEN
        CREATE USER $UMAMI_USER WITH PASSWORD '$UMAMI_DB_PASSWORD';
    END IF;
END
\$\$;

-- Create umami database if not exists
SELECT 'CREATE DATABASE $UMAMI_DB OWNER $UMAMI_USER'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$UMAMI_DB')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $UMAMI_DB TO $UMAMI_USER;
EOSQL

echo "Umami database initialization complete"
echo ""
echo "Next steps:"
echo "1. Run: docker compose up -d umami"
echo "2. Access Umami at http://SERVER_IP:3001"
echo "3. Login with admin/umami and change password"
echo "4. Add website and copy Website ID to .env as UMAMI_WEBSITE_ID"
