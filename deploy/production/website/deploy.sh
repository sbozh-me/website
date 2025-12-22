#!/bin/bash

# sbozh.me Deployment Script
# Deploys Directus CRM to Hetzner VPS

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
SSH_HOST="sbozhme"  # SSH config alias
DOMAIN="${1:-}"     # Domain is now first argument
APP_DIR="/opt/sbozh-me"

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

# Usage info (domain is optional)
if [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
    echo "Usage: $0 [DOMAIN]"
    echo ""
    echo "Example:"
    echo "  $0 pifagor.sbozh.me"
    echo ""
    echo "If no domain provided, SSL will be skipped"
    exit 0
fi

print_header "🚀 sbozh.me Deployment"
print_info "Server: $SERVER_IP"
[ -n "$DOMAIN" ] && print_info "Domain: $DOMAIN" || print_warning "No domain provided (will skip SSL)"

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
    print_info "Make sure you can SSH to the server: ssh $SSH_HOST"
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

# Copy files to server
print_header "4️⃣ Copying Application Files"
print_info "Uploading docker-compose.yaml..."
scp -q "$SCRIPT_DIR/docker-compose.yaml" $SSH_HOST:$APP_DIR/docker-compose.yaml
print_success "docker-compose.yaml uploaded"

print_info "Uploading .env file..."
scp -q "$SCRIPT_DIR/.env" $SSH_HOST:$APP_DIR/.env
print_success ".env file uploaded"

print_info "Uploading init scripts..."
scp -q "$SCRIPT_DIR/docker-init.sh" $SSH_HOST:$APP_DIR/
ssh $SSH_HOST "chmod +x $APP_DIR/docker-init.sh"
print_success "Init scripts uploaded"

print_info "Uploading Directus schema snapshots..."
ssh $SSH_HOST "mkdir -p $APP_DIR/snapshots"
scp -q "$SCRIPT_DIR/snapshots/"*.yaml $SSH_HOST:$APP_DIR/snapshots/
print_success "Schema snapshots uploaded"

print_info "Preparing uploads directory..."
ssh $SSH_HOST "sudo mkdir -p /mnt/sbozh-me-data/directus/uploads && sudo chown oktavian:oktavian /mnt/sbozh-me-data/directus/uploads"
print_success "Uploads directory prepared"

print_info "Uploading deployment scripts..."
ssh $SSH_HOST "mkdir -p $APP_DIR/scripts"
scp -q "$SCRIPT_DIR/scripts/"* $SSH_HOST:$APP_DIR/scripts/
ssh $SSH_HOST "chmod +x $APP_DIR/scripts/*.sh"
print_success "Scripts uploaded"

print_info "Uploading services for local build..."
ssh $SSH_HOST "mkdir -p $APP_DIR/services"
rsync -aq --exclude='node_modules' --exclude='dist' "$SCRIPT_DIR/../../services/pdf-generator" $SSH_HOST:$APP_DIR/services/
print_success "Services uploaded"

# Start services
print_header "5️⃣ Starting Services"
print_info "Pulling Docker images..."
ssh $SSH_HOST "cd $APP_DIR && docker compose pull --ignore-buildable"
print_success "Images pulled"

print_info "Building local services..."
ssh $SSH_HOST "cd $APP_DIR && docker compose build pdf-generator"
print_success "Local services built"

print_info "Starting containers..."
ssh $SSH_HOST "cd $APP_DIR && docker compose up -d"
print_success "Containers started"

print_info "Waiting for services to be healthy..."
sleep 10

# Check service health
print_info "Checking service status..."
ssh $SSH_HOST "cd $APP_DIR && docker compose ps"
print_success "Services are running"

# Configure Nginx if domain is provided
if [ -n "$DOMAIN" ]; then
    print_header "6️⃣ Configuring Nginx & SSL"

    # Create certbot directory
    ssh $SSH_HOST "sudo mkdir -p /var/www/certbot"

    # Check if SSL certificate already exists
    print_info "Checking for existing SSL certificate..."
    if ssh $SSH_HOST "sudo test -d /etc/letsencrypt/live/$DOMAIN"; then
        print_success "SSL certificate already exists for $DOMAIN"

        # Deploy full SSL configuration
        print_info "Deploying full SSL configuration..."
        scp -q "$SCRIPT_DIR/nginx.conf.template" $SSH_HOST:/tmp/nginx.conf
        ssh $SSH_HOST "sudo sed 's/{{DOMAIN}}/$DOMAIN/g' /tmp/nginx.conf | sudo tee /etc/nginx/sites-available/sbozh-me > /dev/null"
        ssh $SSH_HOST "sudo ln -sf /etc/nginx/sites-available/sbozh-me /etc/nginx/sites-enabled/sbozh-me"
        ssh $SSH_HOST "sudo rm /etc/nginx/sites-enabled/default 2>/dev/null || true"

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
        print_warning "No SSL certificate found, setting up SSL via Cloudflare DNS..."
        print_warning "Make sure DNS records for $DOMAIN point to $SERVER_IP!"

        # Check for Cloudflare credentials on server
        if ! ssh $SSH_HOST "sudo test -f /root/.cloudflare.ini"; then
            print_error "Cloudflare credentials not found on server!"
            print_info "Create /root/.cloudflare.ini on server with:"
            echo "  dns_cloudflare_api_token = YOUR_TOKEN"
            print_info "Then run: sudo chmod 600 /root/.cloudflare.ini"
            print_warning "Skipping SSL setup. Run setup-ssl.sh manually after configuring credentials:"
            echo "  ssh $SSH_HOST \"sudo $APP_DIR/scripts/setup-ssl.sh admin@$DOMAIN\""
        else
            # Run setup-ssl.sh for wildcard certificate
            print_info "Obtaining wildcard SSL certificate via Cloudflare DNS-01..."
            if ssh $SSH_HOST "sudo $APP_DIR/scripts/setup-ssl.sh admin@$DOMAIN"; then
                print_success "Wildcard SSL certificate obtained"

                # Deploy full SSL configuration
                print_info "Deploying full SSL configuration..."
                scp -q "$SCRIPT_DIR/nginx.conf.template" $SSH_HOST:/tmp/nginx.conf
                ssh $SSH_HOST "sudo cp /tmp/nginx.conf /etc/nginx/sites-available/sbozh-me"
                ssh $SSH_HOST "sudo ln -sf /etc/nginx/sites-available/sbozh-me /etc/nginx/sites-enabled/sbozh-me"
                ssh $SSH_HOST "sudo rm /etc/nginx/sites-enabled/default 2>/dev/null || true"

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
                echo "  ssh $SSH_HOST \"sudo $APP_DIR/scripts/setup-ssl.sh admin@$DOMAIN\""
            fi
        fi
    fi

    # Enable nginx at boot
    ssh $SSH_HOST "sudo systemctl enable nginx"
    print_success "Nginx enabled at boot"
else
    print_header "7️⃣ Skipping Nginx & SSL Configuration"
    print_warning "No domain provided - skipping SSL setup"
    print_info "Directus is accessible at: http://$SERVER_IP:8055"
fi

# Final health check
print_header "8️⃣ Final Health Check"
print_info "Checking Directus health endpoint..."
sleep 5

if curl -f -s http://$SERVER_IP:8055/server/health > /dev/null; then
    print_success "Directus is healthy!"
else
    print_warning "Health check didn't pass yet (services may still be starting)"
fi

# Print summary
print_header "✅ Deployment Complete!"

if [ -n "$DOMAIN" ]; then
    echo "🌐 Directus URL: https://$DOMAIN"
    echo "🔒 Admin: https://$DOMAIN/admin"
else
    echo "🌐 Directus URL: http://$SERVER_IP:8055"
    echo "🔒 Admin: http://$SERVER_IP:8055/admin"
fi

echo ""
echo "📝 Admin Credentials (from .env):"
echo "   Email: $(grep ADMIN_EMAIL $SCRIPT_DIR/.env | cut -d= -f2)"
echo "   Password: [check .env file]"
echo ""
echo "📊 Useful Commands:"
echo "   View logs:    ssh $SSH_HOST 'cd $APP_DIR && docker compose logs -f'"
echo "   Restart:      ssh $SSH_HOST 'cd $APP_DIR && docker compose restart'"
echo "   Stop:         ssh $SSH_HOST 'cd $APP_DIR && docker compose down'"
echo "   Status:       ssh $SSH_HOST 'cd $APP_DIR && docker compose ps'"
echo ""

print_success "Deployment completed successfully! 🎉"
