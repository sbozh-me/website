#!/bin/bash
# Initialize Umami database and user
# This script runs automatically on first PostgreSQL startup (when data dir is empty)
# For existing servers, use scripts/init-umami.sh instead

set -e

# Check if UMAMI_DB_PASSWORD is set
if [ -z "$UMAMI_DB_PASSWORD" ]; then
    echo "UMAMI_DB_PASSWORD not set, skipping Umami database initialization"
    exit 0
fi

UMAMI_USER="${UMAMI_DB_USER:-umami}"
UMAMI_DB="${UMAMI_DB_NAME:-umami}"

echo "Creating Umami database and user..."

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
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
