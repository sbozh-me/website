#!/bin/bash
set -e

# Analytics Infrastructure Setup Script
# This script helps with the initial setup of Umami and GlitchTip

echo "═══════════════════════════════════════════════════════════"
echo "            Analytics Infrastructure Setup                    "
echo "═══════════════════════════════════════════════════════════"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Run 'make setup' first."
    exit 1
fi

# Function to wait for a service
wait_for_service() {
    local name=$1
    local url=$2
    local max_attempts=30
    local attempt=0

    echo -n "⏳ Waiting for $name..."

    while [ $attempt -lt $max_attempts ]; do
        if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|301\|302"; then
            echo " ✅"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 2
        echo -n "."
    done

    echo " ⚠️  (may need more time)"
    return 1
}

# Check if services are running
echo "📊 Checking service status..."
echo ""

# Check PostgreSQL
if docker exec analytics-postgres pg_isready -U analytics_admin > /dev/null 2>&1; then
    echo "✅ PostgreSQL is healthy"
else
    echo "❌ PostgreSQL is not ready"
    exit 1
fi

# Check Redis
if docker exec analytics-redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is healthy"
else
    echo "❌ Redis is not ready"
    exit 1
fi

# Check Umami
wait_for_service "Umami" "http://localhost:3001"

# Check GlitchTip (may have connection issues initially)
echo -n "⏳ Checking GlitchTip..."
if docker ps | grep -q "glitchtip-web.*Up"; then
    echo " ✅ (container running)"
else
    echo " ❌"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "                    Setup Instructions                        "
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📊 Umami Analytics Setup:"
echo "1. Open: http://localhost:3001"
echo "2. Login with: admin / umami"
echo "3. ⚠️  IMMEDIATELY change the admin password!"
echo "4. Add your website:"
echo "   - Go to Settings → Websites → Add website"
echo "   - Name: sbozh.me Development"
echo "   - Domain: localhost"
echo "5. Copy the Website ID to your .env.local file"
echo ""
echo "🐛 GlitchTip Error Tracking Setup:"
echo "1. Open: http://localhost:3002"
echo "   Note: If connection fails, container may still be initializing"
echo "2. Create your admin account (first user)"
echo "3. Create an organization (e.g., 'sbozh')"
echo "4. Create a project (e.g., 'website')"
echo "5. Get the DSN from project settings"
echo "6. Add the DSN to your .env.local file"
echo ""
echo "📝 Next.js Integration (.env.local):"
echo "NEXT_PUBLIC_ANALYTICS_ENABLED=true"
echo "NEXT_PUBLIC_UMAMI_WEBSITE_ID=<your-website-id>"
echo "NEXT_PUBLIC_UMAMI_SCRIPT_URL=http://localhost:3001/script.js"
echo "NEXT_PUBLIC_GLITCHTIP_DSN=<your-dsn>"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "                     Useful Commands                          "
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 View logs:"
echo "   make logs          - All services"
echo "   make logs-umami    - Umami only"
echo "   make logs-glitchtip - GlitchTip only"
echo ""
echo "🔄 Restart services:"
echo "   make restart       - All services"
echo "   docker-compose restart umami"
echo "   docker-compose restart glitchtip-web"
echo ""
echo "📊 Check status:"
echo "   make status        - Service health"
echo "   docker-compose ps  - Container status"
echo ""
echo "💾 Backup data:"
echo "   make backup        - Create database backup"
echo ""
echo "═══════════════════════════════════════════════════════════"

# Check for common issues
echo ""
echo "🔍 Troubleshooting:"

# Check if ports are in use
if ! nc -z localhost 3001 2>/dev/null; then
    echo "⚠️  Port 3001 (Umami) appears to be blocked or not accessible"
fi

if ! nc -z localhost 3002 2>/dev/null; then
    echo "⚠️  Port 3002 (GlitchTip) may still be initializing or blocked"
fi

# Check memory usage
TOTAL_MEM=$(docker stats --no-stream --format "table {{.MemUsage}}" | tail -n +2 | awk '{print $1}' | sed 's/MiB//g' | awk '{sum+=$1} END {printf "%.0f", sum}')
if [ ! -z "$TOTAL_MEM" ]; then
    echo "📊 Total memory usage: ~${TOTAL_MEM}MB"
fi

echo ""
echo "✅ Setup script complete. Follow the instructions above to configure your services."