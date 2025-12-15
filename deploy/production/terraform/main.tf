terraform {
  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.45"
    }
  }
  required_version = ">= 1.0"
}

provider "hcloud" {
  token = var.hcloud_token
}

# SSH Key
resource "hcloud_ssh_key" "sbozh_me" {
  name       = "ludus-crm-deploy"
  public_key = var.ssh_public_key
}

# Firewall
resource "hcloud_firewall" "sbozh_me" {
  name = "ludus-crm-firewall"

  # SSH
  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "22"
    source_ips = [
      "0.0.0.0/0",
      "::/0"
    ]
  }

  # HTTP
  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "80"
    source_ips = [
      "0.0.0.0/0",
      "::/0"
    ]
  }

  # HTTPS
  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "443"
    source_ips = [
      "0.0.0.0/0",
      "::/0"
    ]
  }
}

# Server
resource "hcloud_server" "sbozh_me" {
  name        = "ludus-crm-${var.environment}"
  image       = "ubuntu-24.04"
  server_type = var.server_type
  location    = var.location
  ssh_keys    = [hcloud_ssh_key.sbozh_me.id]
  firewall_ids = [hcloud_firewall.sbozh_me.id]

  user_data = templatefile("${path.module}/cloud-init.yaml", {
    domain         = var.domain
    ssh_public_key = var.ssh_public_key
    root_password  = var.root_password
  })

  labels = {
    application = "ludus-crm"
    environment = var.environment
    managed_by  = "terraform"
  }

  public_net {
    ipv4_enabled = true
    ipv6_enabled = true
  }
}

# Volume for persistent data
resource "hcloud_volume" "sbozh_me_data" {
  name      = "ludus-crm-data-${var.environment}"
  size      = var.volume_size
  location  = var.location
  format    = "ext4"

  labels = {
    application = "ludus-crm"
    environment = var.environment
  }

  # Prevent accidental deletion of volume with data
  lifecycle {
    prevent_destroy = false
  }
}

resource "hcloud_volume_attachment" "sbozh_me_data" {
  volume_id = hcloud_volume.sbozh_me_data.id
  server_id = hcloud_server.sbozh_me.id
  automount = true
}