#!/bin/bash
set -e

# Deploy web and pdf-generator services with specified image tag
# Usage: ./deploy-web.sh [tag]
# Example: ./deploy-web.sh v0.11.1
#          ./deploy-web.sh main
#          ./deploy-web.sh (defaults to 'main')

TAG=${1:-main}
APP_DIR="/opt/sbozh-me"
ENV_FILE="$APP_DIR/.env"

echo "Deploying services with tag: $TAG..."

cd "$APP_DIR"

# Update image tags in .env
for VAR in WEB_IMAGE_TAG PDF_GENERATOR_IMAGE_TAG; do
  if grep -q "${VAR}=" "$ENV_FILE"; then
    sed -i "s/${VAR}=.*/${VAR}=$TAG/" "$ENV_FILE"
  else
    echo "${VAR}=$TAG" >> "$ENV_FILE"
  fi
done

# Pull new images
echo "Pulling images..."
docker compose pull web pdf-generator

# Restart services (pdf-generator first since web depends on it)
echo "Restarting services..."
docker compose up -d pdf-generator
sleep 3
docker compose up -d web

# Health check for pdf-generator
echo "Running pdf-generator health check..."
sleep 5
if docker compose exec -T pdf-generator wget -q --spider http://localhost:3010/health 2>/dev/null; then
  echo "pdf-generator health check passed"
else
  echo "pdf-generator health check failed!"
  docker compose logs --tail=50 pdf-generator
  exit 1
fi

# Health check for web
echo "Running web health check..."
if curl -sf http://localhost:3000 > /dev/null; then
  echo "web health check passed"
  echo "Successfully deployed services with tag: $TAG"
else
  echo "web health check failed!"
  docker compose logs --tail=50 web
  exit 1
fi
