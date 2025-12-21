#!/bin/bash
set -e

# GlitchTip Error Tracking Setup Script
# This script helps with the initial setup of GlitchTip

echo "═══════════════════════════════════════════════════════════"
echo "         GlitchTip Error Tracking Setup                    "
echo "═══════════════════════════════════════════════════════════"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo ".env file not found. Run 'make setup' first."
    exit 1
fi

# Function to wait for a service
wait_for_service() {
    local name=$1
    local url=$2
    local max_attempts=30
    local attempt=0

    echo -n "Waiting for $name..."

    while [ $attempt -lt $max_attempts ]; do
        if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|301\|302"; then
            echo " Ready!"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 2
        echo -n "."
    done

    echo " (may need more time)"
    return 1
}

# Check if services are running
echo "Checking service status..."
echo ""

# Check PostgreSQL
if docker exec sbozh-glitchtip-db pg_isready -U glitchtip -d glitchtip > /dev/null 2>&1; then
    echo "PostgreSQL is healthy"
else
    echo "PostgreSQL is not ready"
    exit 1
fi

# Check Redis
if docker exec sbozh-glitchtip-redis redis-cli ping > /dev/null 2>&1; then
    echo "Redis is healthy"
else
    echo "Redis is not ready"
    exit 1
fi

# Check GlitchTip Web
wait_for_service "GlitchTip" "http://localhost:3002/_health/"

# Check Worker
echo -n "Checking GlitchTip Worker..."
if docker ps | grep -q "sbozh-glitchtip-worker.*Up"; then
    echo " Running!"
else
    echo " Not running"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "                    Setup Instructions                      "
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "GlitchTip Error Tracking Setup:"
echo "1. Open: http://localhost:3002"
echo "2. Create your admin account (first user becomes admin)"
echo "3. Create an organization (e.g., 'sbozh')"
echo "4. Create a project (e.g., 'website', platform: 'Next.js')"
echo "5. Copy the DSN from: Project Settings -> Client Keys (DSN)"
echo ""
echo "Next.js Integration (.env.local):"
echo "NEXT_PUBLIC_GLITCHTIP_DSN=<your-dsn>"
echo ""
echo "Install Sentry SDK in your Next.js app:"
echo "pnpm add @sentry/nextjs"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "                     Useful Commands                        "
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "View logs:"
echo "   make logs          - All services"
echo "   make logs-web      - GlitchTip web only"
echo "   make logs-worker   - GlitchTip worker only"
echo ""
echo "Restart services:"
echo "   make restart       - All services"
echo "   docker-compose restart web"
echo ""
echo "Check status:"
echo "   make status        - Service health"
echo "   make health        - Quick health check"
echo "   docker-compose ps  - Container status"
echo ""
echo "Backup data:"
echo "   make backup        - Create database backup"
echo ""
echo "═══════════════════════════════════════════════════════════"

# Check for common issues
echo ""
echo "Troubleshooting:"

# Check if port is in use
if ! nc -z localhost 3002 2>/dev/null; then
    echo "Port 3002 (GlitchTip) may still be initializing or blocked"
fi

# Check memory usage
TOTAL_MEM=$(docker stats --no-stream --format "table {{.MemUsage}}" 2>/dev/null | tail -n +2 | awk '{print $1}' | sed 's/MiB//g' | awk '{sum+=$1} END {printf "%.0f", sum}' 2>/dev/null)
if [ ! -z "$TOTAL_MEM" ] && [ "$TOTAL_MEM" != "0" ]; then
    echo "Total memory usage: ~${TOTAL_MEM}MB"
fi

echo ""
echo "Setup script complete. Follow the instructions above to configure GlitchTip."
