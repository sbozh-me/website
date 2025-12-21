# sbozh.me Terraform Infrastructure

Automated Hetzner Cloud infrastructure provisioning for sbozh.me.

## What This Creates

- 🖥️ Hetzner Cloud Server (CPX21 - 3 vCPU, 4GB RAM)
- 🔥 Firewall (SSH, HTTP, HTTPS)
- 💾 Persistent Volume (50GB for database & uploads)
- 🐳 Docker + Docker Compose (auto-installed)
- 🌐 Nginx + Certbot (ready for SSL)
- 🔒 SSH Key authentication
- ⚡ Optimized system configuration

**Cost: ~€8-10/month**

## Prerequisites

1. **Hetzner Cloud Account**
   - Sign up at: https://console.hetzner.cloud/
   - Create API Token: Console → Security → API Tokens

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
   # Generate new key if needed
   ssh-keygen -t ed25519 -C "sbozh-me-deploy" -f ~/.ssh/sbozh_me
   ```

## Security Model

This setup implements a hardened security configuration:

- **Non-root user**: All operations use the `dev` user with sudo access
- **Root SSH login**: DISABLED for security
- **Password authentication**: DISABLED (SSH keys only)
- **Root console access**: Available via Hetzner console with password from `terraform.tfvars`
- **SSH hardening**: MaxAuthTries=3, X11Forwarding disabled, AllowUsers=dev only

## Quick Start

### 1. Configure Variables

```bash
cd deploy/production/terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:
```hcl
hcloud_token   = "your-hetzner-api-token"
ssh_public_key = "ssh-ed25519 AAAAC3... your-email@example.com"
domain         = "crm.yourdomain.com"  # Optional
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

Type `yes` when prompted. This takes 2-3 minutes.

### 5. Wait for Cloud-Init

Cloud-init installs Docker and prepares the server (5-10 minutes):

```bash
# Get server IP from output
SERVER_IP=$(terraform output -raw server_ip)

# Wait for cloud-init to complete
ssh oktavian@$SERVER_IP "cloud-init status --wait"

# Verify installation
ssh oktavian@$SERVER_IP "/home/dev/health-check.sh"
```

### 6. Point Your Domain

Add an A record for your domain:
```
Type: A
Name: crm (or @)
Value: <SERVER_IP from terraform output>
TTL: 300
```

## Outputs

After `terraform apply`, you'll see:

```
server_ip        = "X.X.X.X"
server_ipv6      = "xxxx:xxxx:..."
ssh_command      = "ssh oktavian@X.X.X.X"
volume_path      = "/mnt/sbozh-me-data"
next_steps       = "..."
```

## Manual Verification

```bash
# SSH into server
ssh oktavian@$(terraform output -raw server_ip)

# Check Docker
docker --version
docker compose version

# Check data volume
ls -la /mnt/sbozh-me-data

# Check system status
systemctl status docker
```

## Cleanup

To destroy all infrastructure:

```bash
terraform destroy
```

⚠️ **Warning**: This will delete the server and all data!

## Customization

Edit `variables.tf` defaults or override in `terraform.tfvars`:

```hcl
server_type = "cpx31"  # 4 vCPU, 8GB RAM for larger scale
location    = "hel1"   # Helsinki for better EU coverage
volume_size = 100      # Larger volume for more data
```

## Next Steps

After infrastructure is ready:

1. ✅ Server created
2. → Deploy application (see `../deploy/` directory)
3. → Configure Nginx & SSL
4. → Start services

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
- Check firewall rules: `terraform state show hcloud_firewall.sbozh_me`
- Verify SSH key: `ssh-add -l`

### Need to recreate server?

```bash
terraform taint hcloud_server.sbozh_me
terraform apply
```
