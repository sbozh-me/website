#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "Seeding Blog Data..."

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

# Get auth token
echo "Authenticating..."
TOKEN=$(curl -s -X POST http://localhost:8055/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@sbozh.me","password":"directus123"}' | jq -r '.data.access_token')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo "Error: Failed to authenticate"
    exit 1
fi

API="http://localhost:8055"
AUTH="Authorization: Bearer $TOKEN"

SEED_DATA=$(cat ./snapshots/seed-data.json)

echo ""
echo "Importing personas..."
PERSONA_NUM=0
while read -r persona; do
    ((PERSONA_NUM++))
    RESULT=$(echo "$persona" | curl -s -X POST "$API/items/personas" \
        -H "$AUTH" \
        -H "Content-Type: application/json" \
        -d @-)
    ERROR=$(echo "$RESULT" | jq -r '.errors[0].message // empty')
    if [ -n "$ERROR" ]; then
        echo "  Warning: $ERROR"
    else
        NAME=$(echo "$persona" | jq -r '.name')
        echo "  Created persona: $NAME"
    fi
done < <(echo "$SEED_DATA" | jq -c '.personas[]')

echo ""
echo "Importing tags..."
TAG_NUM=0
while read -r tag; do
    ((TAG_NUM++))
    RESULT=$(echo "$tag" | curl -s -X POST "$API/items/tags" \
        -H "$AUTH" \
        -H "Content-Type: application/json" \
        -d @-)
    ERROR=$(echo "$RESULT" | jq -r '.errors[0].message // empty')
    if [ -n "$ERROR" ]; then
        echo "  Warning: $ERROR"
    else
        NAME=$(echo "$tag" | jq -r '.name')
        echo "  Created tag: $NAME"
    fi
done < <(echo "$SEED_DATA" | jq -c '.tags[]')

echo ""
echo "Importing posts..."
POST_NUM=0
while read -r post; do
    ((POST_NUM++))

    # Extract tags array and remove from post object
    TAGS=$(echo "$post" | jq -c '.tags')
    POST_DATA=$(echo "$post" | jq 'del(.tags)')

    # Create post
    RESULT=$(echo "$POST_DATA" | curl -s -X POST "$API/items/posts" \
        -H "$AUTH" \
        -H "Content-Type: application/json" \
        -d @-)

    ERROR=$(echo "$RESULT" | jq -r '.errors[0].message // empty')
    if [ -n "$ERROR" ]; then
        echo "  Warning: $ERROR"
        continue
    fi

    POST_ID=$(echo "$RESULT" | jq -r '.data.id')
    TITLE=$(echo "$post" | jq -r '.title')
    echo "  Created post: $TITLE"

    # Create M2M relations for tags
    for TAG_ID in $(echo "$TAGS" | jq -r '.[]'); do
        curl -s -X POST "$API/items/posts_tags" \
            -H "$AUTH" \
            -H "Content-Type: application/json" \
            -d "{\"posts_id\": \"$POST_ID\", \"tags_id\": \"$TAG_ID\"}" > /dev/null
    done
    echo "    Linked $(echo "$TAGS" | jq -r 'length') tags"

done < <(echo "$SEED_DATA" | jq -c '.posts[]')

echo ""
echo "Seed data imported successfully!"
echo ""
echo "View in Directus: http://localhost:8055"
