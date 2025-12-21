variable "hcloud_token" {
  description = "Hetzner Cloud API Token"
  type        = string
  sensitive   = true
}

variable "ssh_public_key" {
  description = "SSH public key for server access"
  type        = string
}

variable "root_password" {
  description = "Root user password (for emergency console access only, SSH login disabled)"
  type        = string
  sensitive   = true
}

variable "domain" {
  description = "Domain name for the application"
  type        = string
  default     = ""
}

variable "environment" {
  description = "Environment name (prod, staging, dev)"
  type        = string
  default     = "prod"
}

variable "server_type" {
  description = "Hetzner Cloud server type"
  type        = string
  default     = "cpx21" # 3 vCPU, 4GB RAM, €8.21/month
}

variable "location" {
  description = "Hetzner Cloud location"
  type        = string
  default     = "nbg1" # Nuremberg, Germany
}

variable "volume_size" {
  description = "Size of the data volume in GB"
  type        = number
  default     = 50
}
