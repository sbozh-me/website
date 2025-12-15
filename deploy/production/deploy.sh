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
print_info "Uploading docker-compose.prod.yaml..."
scp -q "$SCRIPT_DIR/docker-compose.prod.yaml" $SSH_HOST:$APP_DIR/docker-compose.yaml
print_success "docker-compose.yaml uploaded"

print_info "Uploading .env file..."
scp -q "$SCRIPT_DIR/.env" $SSH_HOST:$APP_DIR/.env
print_success ".env file uploaded"

print_info "Uploading application source for Docker build..."
ssh $SSH_HOST "mkdir -p $APP_DIR/directus"
rsync -r --progress --stats --exclude='node_modules' --exclude='dist' --exclude='data' --exclude='uploads' "$SCRIPT_DIR/../directus/" $SSH_HOST:$APP_DIR/directus/
print_success "Directus application uploaded"

print_info "Uploading services source for Docker build..."
ssh $SSH_HOST "mkdir -p $APP_DIR/services"
rsync -r --progress --stats --exclude='node_modules' --exclude='dist' --exclude='build' "$SCRIPT_DIR/../services/" $SSH_HOST:$APP_DIR/services/
print_success "Services uploaded"

print_info "Preparing uploads directory..."
ssh $SSH_HOST "sudo mkdir -p /mnt/sbozh-me-data/directus/uploads && sudo chown oktavian:oktavian /mnt/sbozh-me-data/directus/uploads"
print_success "Uploads directory prepared"

# Build extensions on server
#print_header "5️⃣ Building Extensions"
#print_info "Building kr-list-module extension..."
#ssh $SSH_HOST "export PATH=~/.nvm/versions/node/v22.21.0/bin:\$PATH && cd $APP_DIR/directus/extensions/kr-list-module && npm install && npm run build"
#print_success "Extension built"

# Start services
print_header "5️⃣ Starting Services"
print_info "Building Docker images..."
ssh $SSH_HOST "cd $APP_DIR && docker compose build"
print_success "Images built"

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
        print_warning "No SSL certificate found, setting up SSL..."
        print_warning "Make sure $DOMAIN points to $SERVER_IP!"

        # Deploy HTTP-only configuration first
        print_info "Deploying HTTP-only configuration for Let's Encrypt..."
        scp -q "$SCRIPT_DIR/nginx-http.conf.template" $SSH_HOST:/tmp/nginx-http.conf
        ssh $SSH_HOST "sudo sed 's/{{DOMAIN}}/$DOMAIN/g' /tmp/nginx-http.conf | sudo tee /etc/nginx/sites-available/sbozh-me > /dev/null"
        ssh $SSH_HOST "sudo ln -sf /etc/nginx/sites-available/sbozh-me /etc/nginx/sites-enabled/sbozh-me"
        ssh $SSH_HOST "sudo rm /etc/nginx/sites-enabled/default 2>/dev/null || true"

        # Test and start nginx
        if ssh $SSH_HOST "sudo nginx -t" &> /dev/null; then
            ssh $SSH_HOST "sudo systemctl start nginx"
            print_success "Nginx started with HTTP-only configuration"
        else
            print_error "Nginx configuration test failed"
            ssh $SSH_HOST "sudo nginx -t"
            exit 1
        fi

        # Get SSL certificate
        print_info "Obtaining SSL certificate from Let's Encrypt..."
        if ssh $SSH_HOST "sudo certbot certonly --webroot -w /var/www/certbot -d $DOMAIN --email admin@$DOMAIN --agree-tos --non-interactive"; then
            print_success "SSL certificate obtained"

            # Now deploy full SSL configuration
            print_info "Deploying full SSL configuration..."
            scp -q "$SCRIPT_DIR/nginx.conf.template" $SSH_HOST:/tmp/nginx.conf
            ssh $SSH_HOST "sudo sed 's/{{DOMAIN}}/$DOMAIN/g' /tmp/nginx.conf | sudo tee /etc/nginx/sites-available/sbozh-me > /dev/null"

            # Test and reload with SSL
            if ssh $SSH_HOST "sudo nginx -t" &> /dev/null; then
                ssh $SSH_HOST "sudo systemctl reload nginx"
                print_success "Nginx reloaded with SSL"
            else
                print_error "SSL configuration test failed"
                ssh $SSH_HOST "sudo nginx -t"
                exit 1
            fi
        else
            print_error "Failed to obtain SSL certificate"
            print_warning "Nginx is running with HTTP only. You can retry SSL setup later with:"
            echo "  ssh $SSH_HOST \"sudo certbot certonly --webroot -w /var/www/certbot -d $DOMAIN --email admin@$DOMAIN --agree-tos\""
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
