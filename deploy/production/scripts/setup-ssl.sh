#!/bin/bash
# Setup wildcard SSL certificate via Cloudflare DNS-01 challenge
# Usage: sudo ./setup-ssl.sh [email]
#
# Prerequisites:
# 1. Create Cloudflare API token at https://dash.cloudflare.com/profile/api-tokens
#    - Permissions: Zone:DNS:Edit for sbozh.me
# 2. Create /root/.cloudflare.ini with:
#    dns_cloudflare_api_token = YOUR_TOKEN
# 3. Secure the file: chmod 600 /root/.cloudflare.ini

set -e

EMAIL="${1:-admin@sbozh.me}"
DOMAIN="sbozh.me"
CREDENTIALS_FILE="/root/.cloudflare.ini"

echo "=== SSL Certificate Setup for $DOMAIN ==="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Error: Please run as root (sudo ./setup-ssl.sh)"
    exit 1
fi

# Check for Cloudflare credentials
if [ ! -f "$CREDENTIALS_FILE" ]; then
    echo "Error: Cloudflare credentials not found at $CREDENTIALS_FILE"
    echo ""
    echo "Create the file with:"
    echo "  echo 'dns_cloudflare_api_token = YOUR_TOKEN' > $CREDENTIALS_FILE"
    echo "  chmod 600 $CREDENTIALS_FILE"
    echo ""
    echo "Get your API token from: https://dash.cloudflare.com/profile/api-tokens"
    exit 1
fi

# Check file permissions
PERMS=$(stat -c %a "$CREDENTIALS_FILE" 2>/dev/null || stat -f %OLp "$CREDENTIALS_FILE")
if [ "$PERMS" != "600" ]; then
    echo "Warning: Fixing permissions on $CREDENTIALS_FILE"
    chmod 600 "$CREDENTIALS_FILE"
fi

echo "Obtaining wildcard certificate for $DOMAIN and *.$DOMAIN..."

certbot certonly \
    --dns-cloudflare \
    --dns-cloudflare-credentials "$CREDENTIALS_FILE" \
    -d "$DOMAIN" \
    -d "*.$DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --non-interactive

echo ""
echo "=== Certificate obtained successfully! ==="
echo ""
echo "Certificate files:"
echo "  /etc/letsencrypt/live/$DOMAIN/fullchain.pem"
echo "  /etc/letsencrypt/live/$DOMAIN/privkey.pem"
echo ""
echo "Next steps:"
echo "1. Deploy nginx config: sudo cp /opt/sbozh-me/nginx.conf.template /etc/nginx/sites-available/sbozh-me.conf"
echo "2. Enable site: sudo ln -sf /etc/nginx/sites-available/sbozh-me.conf /etc/nginx/sites-enabled/"
echo "3. Remove default: sudo rm -f /etc/nginx/sites-enabled/default"
echo "4. Test config: sudo nginx -t"
echo "5. Reload nginx: sudo systemctl reload nginx"
echo ""
echo "Certificate will auto-renew via certbot timer."
