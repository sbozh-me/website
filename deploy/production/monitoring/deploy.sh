#!/bin/bash

# GlitchTip Error Tracking Deployment Script
# Deploys GlitchTip to Hetzner VPS

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Configuration
SSH_HOST="monitoring"  # SSH config alias for monitoring server
DOMAIN="${1:-monitoring.sbozh.me}"  # Default to monitoring.sbozh.me
APP_DIR="/opt/monitoring"

# Get server IP from SSH config for display purposes
SERVER_IP=$(ssh -G $SSH_HOST | grep "^hostname" | awk '{print $2}')

# Helper functions
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_header() {
    echo ""
    echo "═══════════════════════════════════════════"
    echo "$1"
    echo "═══════════════════════════════════════════"
    echo ""
}

# Usage info
if [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
    echo "Usage: $0 [DOMAIN]"
    echo ""
    echo "Example:"
    echo "  $0 monitoring.sbozh.me"
    echo ""
    echo "If no domain provided, defaults to monitoring.sbozh.me"
    exit 0
fi

print_header "🚀 GlitchTip Monitoring Deployment"
print_info "Server: $SERVER_IP"
print_info "Domain: $DOMAIN"

# Check if .env exists
if [ ! -f "$SCRIPT_DIR/.env" ]; then
    print_error ".env file not found!"
    print_info "Copy .env.example to .env and configure it:"
    echo ""
    echo "  cp $SCRIPT_DIR/.env.example $SCRIPT_DIR/.env"
    echo "  nano $SCRIPT_DIR/.env"
    echo ""
    exit 1
fi

# Verify SSH connection
print_header "1️⃣ Verifying SSH Connection"
if ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no $SSH_HOST "echo 'SSH OK'" &> /dev/null; then
    print_success "SSH connection successful"
else
    print_error "Cannot connect to server via SSH"
    print_info "Make sure you have '$SSH_HOST' configured in ~/.ssh/config"
    print_info "Example:"
    echo "  Host $SSH_HOST"
    echo "      HostName YOUR_SERVER_IP"
    echo "      User oktavian"
    echo "      IdentityFile ~/.ssh/your_key"
    exit 1
fi

# Wait for cloud-init if needed
print_header "2️⃣ Checking Server Readiness"
print_info "Checking if cloud-init has completed..."
if ssh $SSH_HOST "[ -f /var/lib/cloud/instance/boot-finished ]"; then
    print_success "Cloud-init completed"
else
    print_warning "Cloud-init still running, waiting..."
    ssh $SSH_HOST "cloud-init status --wait" || true
    print_success "Cloud-init completed"
fi

# Verify Docker is installed
print_info "Verifying Docker installation..."
if ssh $SSH_HOST "docker --version" &> /dev/null; then
    print_success "Docker is installed"
else
    print_error "Docker is not installed on the server"
    exit 1
fi

# Create application directory
print_header "3️⃣ Preparing Application Directory"
ssh $SSH_HOST "sudo mkdir -p $APP_DIR && sudo chown oktavian:oktavian $APP_DIR"
print_success "Application directory created: $APP_DIR"

# Prepare data directory
print_info "Preparing data directory..."
ssh $SSH_HOST "sudo mkdir -p /mnt/monitoring-data/postgres && sudo chown -R oktavian:oktavian /mnt/monitoring-data"
print_success "Data directory prepared: /mnt/monitoring-data"

# Copy files to server
print_header "4️⃣ Copying Application Files"
print_info "Uploading docker-compose.yaml..."
scp -q "$SCRIPT_DIR/docker-compose.yaml" $SSH_HOST:$APP_DIR/docker-compose.yaml
print_success "docker-compose.yaml uploaded"

print_info "Uploading .env file..."
scp -q "$SCRIPT_DIR/.env" $SSH_HOST:$APP_DIR/.env
print_success ".env file uploaded"

print_info "Uploading deployment scripts..."
ssh $SSH_HOST "mkdir -p $APP_DIR/scripts"
scp -q "$SCRIPT_DIR/scripts/"* $SSH_HOST:$APP_DIR/scripts/
ssh $SSH_HOST "chmod +x $APP_DIR/scripts/*.sh"
print_success "Scripts uploaded"

print_info "Uploading nginx configuration..."
scp -q "$SCRIPT_DIR/nginx.conf.template" $SSH_HOST:$APP_DIR/
scp -q "$SCRIPT_DIR/nginx-http.conf.template" $SSH_HOST:$APP_DIR/
print_success "Nginx configuration uploaded"

# Start services
print_header "5️⃣ Starting Services"
print_info "Pulling Docker images..."
ssh $SSH_HOST "cd $APP_DIR && docker compose pull"
print_success "Images pulled"

print_info "Starting containers..."
ssh $SSH_HOST "cd $APP_DIR && docker compose up -d"
print_success "Containers started"

print_info "Waiting for services to be healthy..."
sleep 15

# Check service health
print_info "Checking service status..."
ssh $SSH_HOST "cd $APP_DIR && docker compose ps"
print_success "Services are running"

# Configure Nginx and SSL
print_header "6️⃣ Configuring Nginx & SSL"

# Create certbot directory
ssh $SSH_HOST "sudo mkdir -p /var/www/certbot"

# Check if SSL certificate already exists (wildcard covers monitoring.sbozh.me)
print_info "Checking for existing SSL certificate..."
if ssh $SSH_HOST "sudo test -d /etc/letsencrypt/live/sbozh.me"; then
    print_success "Wildcard SSL certificate exists (*.sbozh.me)"

    # Deploy full SSL configuration
    print_info "Deploying full SSL configuration..."
    ssh $SSH_HOST "sudo cp $APP_DIR/nginx.conf.template /etc/nginx/sites-available/monitoring"
    ssh $SSH_HOST "sudo ln -sf /etc/nginx/sites-available/monitoring /etc/nginx/sites-enabled/monitoring"
    ssh $SSH_HOST "sudo rm -f /etc/nginx/sites-enabled/default"

    # Test and reload
    if ssh $SSH_HOST "sudo nginx -t" &> /dev/null; then
        ssh $SSH_HOST "sudo systemctl reload nginx"
        print_success "Nginx reloaded with SSL"
    else
        print_error "Nginx configuration test failed"
        ssh $SSH_HOST "sudo nginx -t"
        exit 1
    fi
else
    print_warning "No wildcard SSL certificate found, setting up SSL via Cloudflare DNS..."
    print_warning "Make sure DNS records for $DOMAIN point to $SERVER_IP!"

    # Check for Cloudflare credentials on server
    if ! ssh $SSH_HOST "sudo test -f /root/.cloudflare.ini"; then
        print_error "Cloudflare credentials not found on server!"
        print_info "Create /root/.cloudflare.ini on server with:"
        echo "  dns_cloudflare_api_token = YOUR_TOKEN"
        print_info "Then run: sudo chmod 600 /root/.cloudflare.ini"
        print_warning "Deploying HTTP-only configuration for now..."

        # Deploy HTTP-only configuration
        ssh $SSH_HOST "sudo cp $APP_DIR/nginx-http.conf.template /etc/nginx/sites-available/monitoring"
        ssh $SSH_HOST "sudo ln -sf /etc/nginx/sites-available/monitoring /etc/nginx/sites-enabled/monitoring"
        ssh $SSH_HOST "sudo rm -f /etc/nginx/sites-enabled/default"

        if ssh $SSH_HOST "sudo nginx -t" &> /dev/null; then
            ssh $SSH_HOST "sudo systemctl reload nginx"
            print_success "Nginx configured (HTTP only)"
        fi

        print_warning "Run setup-ssl.sh manually after configuring credentials:"
        echo "  ssh $SSH_HOST \"sudo $APP_DIR/scripts/setup-ssl.sh admin@sbozh.me\""
    else
        # Run setup-ssl.sh for wildcard certificate
        print_info "Obtaining wildcard SSL certificate via Cloudflare DNS-01..."
        if ssh $SSH_HOST "sudo $APP_DIR/scripts/setup-ssl.sh admin@sbozh.me"; then
            print_success "Wildcard SSL certificate obtained"

            # Deploy full SSL configuration
            print_info "Deploying full SSL configuration..."
            ssh $SSH_HOST "sudo cp $APP_DIR/nginx.conf.template /etc/nginx/sites-available/monitoring"
            ssh $SSH_HOST "sudo ln -sf /etc/nginx/sites-available/monitoring /etc/nginx/sites-enabled/monitoring"
            ssh $SSH_HOST "sudo rm -f /etc/nginx/sites-enabled/default"

            if ssh $SSH_HOST "sudo nginx -t" &> /dev/null; then
                ssh $SSH_HOST "sudo systemctl restart nginx"
                print_success "Nginx configured with SSL"
            else
                print_error "Nginx configuration test failed"
                ssh $SSH_HOST "sudo nginx -t"
                exit 1
            fi
        else
            print_error "Failed to obtain SSL certificate"
            print_warning "Check Cloudflare credentials and DNS configuration"
            print_info "You can retry manually with:"
            echo "  ssh $SSH_HOST \"sudo $APP_DIR/scripts/setup-ssl.sh admin@sbozh.me\""
        fi
    fi
fi

# Enable nginx at boot
ssh $SSH_HOST "sudo systemctl enable nginx"
print_success "Nginx enabled at boot"

# Final health check
print_header "7️⃣ Final Health Check"
print_info "Checking GlitchTip health endpoint..."
sleep 5

if ssh $SSH_HOST "curl -sf http://localhost:8000/_health/" > /dev/null; then
    print_success "GlitchTip is healthy!"
else
    print_warning "Health check didn't pass yet (services may still be starting)"
    print_info "Check logs with: ssh $SSH_HOST 'cd $APP_DIR && docker compose logs -f'"
fi

# Print summary
print_header "✅ Deployment Complete!"

echo "🌐 GlitchTip URL: https://$DOMAIN"
echo ""
echo "📝 First-Time Setup:"
echo "   1. Navigate to https://$DOMAIN"
echo "   2. Create your admin account (first user becomes admin)"
echo "   3. Create an organization"
echo "   4. Create a project (select 'Next.js' or 'Browser JavaScript')"
echo "   5. Copy the DSN for your application"
echo ""
echo "📊 Next.js Integration:"
echo "   NEXT_PUBLIC_GLITCHTIP_DSN=<your-dsn>"
echo "   SENTRY_DSN=<your-dsn>"
echo ""
echo "📊 Useful Commands:"
echo "   View logs:    ssh $SSH_HOST 'cd $APP_DIR && docker compose logs -f'"
echo "   Restart:      ssh $SSH_HOST 'cd $APP_DIR && docker compose restart'"
echo "   Stop:         ssh $SSH_HOST 'cd $APP_DIR && docker compose down'"
echo "   Status:       ssh $SSH_HOST 'cd $APP_DIR && docker compose ps'"
echo "   Backup:       ssh $SSH_HOST 'cd $APP_DIR && ./scripts/create-backup.sh'"
echo ""

print_success "Deployment completed successfully! 🎉"
