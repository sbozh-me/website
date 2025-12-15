#!/bin/bash
set -e

# Deploy web service with specified image tag
# Usage: ./deploy-web.sh [tag]
# Example: ./deploy-web.sh v0.11.1
#          ./deploy-web.sh main
#          ./deploy-web.sh (defaults to 'main')

TAG=${1:-main}
APP_DIR="/opt/sbozh-me"
ENV_FILE="$APP_DIR/.env"

echo "Deploying web:$TAG..."

cd "$APP_DIR"

# Update image tag in .env
if grep -q "WEB_IMAGE_TAG=" "$ENV_FILE"; then
  sed -i "s/WEB_IMAGE_TAG=.*/WEB_IMAGE_TAG=$TAG/" "$ENV_FILE"
else
  echo "WEB_IMAGE_TAG=$TAG" >> "$ENV_FILE"
fi

# Pull new image
echo "Pulling image..."
docker compose pull web

# Restart web service
echo "Restarting web service..."
docker compose up -d web

# Health check
echo "Running health check..."
sleep 5
if curl -sf http://localhost:3000 > /dev/null; then
  echo "Health check passed"
  echo "Successfully deployed web:$TAG"
else
  echo "Health check failed!"
  docker compose logs --tail=50 web
  exit 1
fi
