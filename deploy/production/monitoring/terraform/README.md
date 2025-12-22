# GlitchTip Monitoring Terraform Infrastructure

Automated Hetzner Cloud infrastructure provisioning for GlitchTip error tracking at monitoring.sbozh.me.

## What This Creates

- Hetzner Cloud Server (CPX11 - 2 vCPU, 2GB RAM)
- Firewall (SSH, HTTP, HTTPS)
- Persistent Volume (20GB for PostgreSQL database)
- Docker + Docker Compose (auto-installed)
- Nginx + Certbot (ready for SSL via Cloudflare DNS-01)
- SSH Key authentication
- Optimized system configuration

**Cost: ~€5.31/month** (€4.35 server + €0.96 volume)

## Prerequisites

1. **Hetzner Cloud Account**
   - Sign up at: https://console.hetzner.cloud/
   - Create API Token: Console -> Security -> API Tokens

2. **Terraform Installed**
   ```bash
   # macOS
   brew install terraform

   # Linux
   wget https://releases.hashicorp.com/terraform/1.9.0/terraform_1.9.0_linux_amd64.zip
   unzip terraform_1.9.0_linux_amd64.zip
   sudo mv terraform /usr/local/bin/
   ```

3. **SSH Key**
   ```bash
   # Generate new key for monitoring server
   ssh-keygen -t ed25519 -C "monitoring-deploy" -f ~/.ssh/monitoring
   ```

## Security Model

This setup implements a hardened security configuration:

- **Non-root user**: All operations use the `oktavian` user with sudo access
- **Root SSH login**: DISABLED for security
- **Password authentication**: DISABLED (SSH keys only)
- **Root console access**: Available via Hetzner console with password from `terraform.tfvars`
- **SSH hardening**: MaxAuthTries=3, X11Forwarding disabled, AllowUsers=oktavian only

## Quick Start

### 1. Configure Variables

```bash
cd deploy/production/monitoring/terraform
cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars
```

Edit `terraform.tfvars`:
```hcl
hcloud_token   = "your-hetzner-api-token"
ssh_public_key = "ssh-ed25519 AAAAC3... your-email@example.com"
root_password  = "your-strong-root-password"
domain         = "monitoring.sbozh.me"
```

### 2. Initialize Terraform

```bash
terraform init
```

### 3. Preview Changes

```bash
terraform plan
```

### 4. Create Infrastructure

```bash
terraform apply
```

Type `yes` when prompted.

### 5. Wait for Cloud-Init

Cloud-init installs Docker and prepares the server:

```bash
# Get server IP from output
SERVER_IP=$(terraform output -raw server_ip)

# Wait for cloud-init to complete
ssh oktavian@$SERVER_IP "cloud-init status --wait"

# Verify installation
ssh oktavian@$SERVER_IP "/home/oktavian/health-check.sh"
```

### 6. Configure SSH Alias

Add to `~/.ssh/config`:
```
Host monitoring
    HostName YOUR_SERVER_IP
    User oktavian
    IdentityFile ~/.ssh/monitoring
```

### 7. Add DNS Record

Add an A record in Cloudflare:
```
Type: A
Name: monitoring
Value: <SERVER_IP from terraform output>
TTL: Auto
Proxy: Off (DNS only)
```

## Outputs

After `terraform apply`, you'll see:

```
server_ip        = "X.X.X.X"
server_ipv6      = "xxxx:xxxx:..."
ssh_command      = "ssh oktavian@X.X.X.X"
volume_path      = "/mnt/monitoring-data"
next_steps       = "..."
```

## Manual Verification

```bash
# SSH into server
ssh monitoring

# Check Docker
docker --version
docker compose version

# Check data volume
ls -la /mnt/monitoring-data

# Check system status
systemctl status docker
```

## Cleanup

To destroy all infrastructure:

```bash
terraform destroy
```

**Warning**: This will delete the server and all data!

## Customization

Edit `variables.tf` defaults or override in `terraform.tfvars`:

```hcl
server_type = "cpx21"  # 4GB RAM for higher traffic
location    = "hel1"   # Helsinki for better EU coverage
volume_size = 50       # Larger volume for more error data
```

## Next Steps

After infrastructure is ready:

1. Server created
2. Deploy GlitchTip (see parent directory - run `./deploy.sh monitoring.sbozh.me`)
3. Configure SSL via Cloudflare DNS-01
4. Create GlitchTip admin account
5. Get DSN for your applications

## Troubleshooting

### Cloud-init taking too long?

```bash
# Check cloud-init logs
ssh oktavian@$SERVER_IP "cat /var/log/cloud-init-output.log"

# Check status
ssh oktavian@$SERVER_IP "cloud-init status"
```

### Can't SSH?

- Wait 30 seconds after `terraform apply`
- Check firewall rules: `terraform state show hcloud_firewall.monitoring`
- Verify SSH key: `ssh-add -l`

### Need to recreate server?

```bash
terraform taint hcloud_server.monitoring
terraform apply
```
