# Postmortem: Umami 502 Error

**Date:** 2024-12-16
**Duration:** ~1 hour
**Impact:** Umami analytics dashboard unavailable (502)

## Summary

Umami failed to start due to PostgreSQL password authentication failure. The `umami` database user existed but had a different password than configured in `.env`.

## Root Cause

The `init-umami-db.sh` script (mounted at `/docker-entrypoint-initdb.d/`) only runs on **first PostgreSQL initialization** when the data directory is empty. Since the database was already initialized (for Directus), the Umami user/database was never created automatically.

The user was likely created manually or by a previous deployment with a different password than what was set in `UMAMI_DB_PASSWORD`.

## Error

```
Raw query failed. Code: `28P01`. Message: `password authentication failed for user "umami"`
```

## Resolution

Updated the umami user password to match `.env`:

```bash
ssh sbozhme "cd /opt/sbozh-me && source .env && \
  docker compose exec -T database psql -U \$DB_USER -d \$DB_DATABASE \
  -c \"ALTER USER umami WITH PASSWORD '\$UMAMI_DB_PASSWORD';\" && \
  docker compose restart umami"
```

## Prevention

Updated `docker-init.sh` to automatically initialize Umami database on deployment:

1. Checks if `umami` user exists in PostgreSQL (not a marker file)
2. Creates user and database if missing
3. Runs on every `make deploy-infra`

```bash
# Check if umami user exists in PostgreSQL
UMAMI_USER_EXISTS=$(docker exec "$DATABASE_CONTAINER" psql -U "$DB_USER" -d "$DB_DATABASE" \
  -tAc "SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = '$UMAMI_USER'" 2>/dev/null)

if [ "$UMAMI_USER_EXISTS" = "1" ]; then
    echo "Umami user already exists. Skipping."
else
    # Create user and database...
fi
```

## Manual Fix (if needed again)

If Umami shows 502 with password auth failure:

```bash
ssh sbozhme
cd /opt/sbozh-me
source .env

# Update password
docker compose exec -T database psql -U $DB_USER -d $DB_DATABASE \
  -c "ALTER USER umami WITH PASSWORD '$UMAMI_DB_PASSWORD';"

# Restart
docker compose restart umami
```

## Lessons Learned

1. PostgreSQL init scripts only run on empty data directories
2. Shared database setups need explicit user/db creation in deployment scripts
3. Check actual database state, not marker files
