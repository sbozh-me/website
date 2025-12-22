output "server_ip" {
  description = "Public IPv4 address of the server"
  value       = hcloud_server.monitoring.ipv4_address
}

output "server_ipv6" {
  description = "Public IPv6 address of the server"
  value       = hcloud_server.monitoring.ipv6_address
}

output "server_name" {
  description = "Server name"
  value       = hcloud_server.monitoring.name
}

output "volume_path" {
  description = "Volume mount path"
  value       = "/mnt/monitoring-data"
}

output "ssh_command" {
  description = "SSH command to connect to the server"
  value       = "ssh oktavian@${hcloud_server.monitoring.ipv4_address}"
}

output "next_steps" {
  description = "Next steps after infrastructure is created"
  value = <<-EOT

  ✅ Monitoring Infrastructure Created Successfully!

  📍 Server IP: ${hcloud_server.monitoring.ipv4_address}
  🔗 SSH: ssh oktavian@${hcloud_server.monitoring.ipv4_address}

  🔒 Security:
  - User: oktavian (with sudo access)
  - Root SSH login: disabled
  - Password auth: disabled (SSH keys only)
  - Root console access: available with password from tfvars

  Next Steps:
  1. Add SSH config alias 'monitoring' pointing to: ${hcloud_server.monitoring.ipv4_address}
  2. Add DNS A record for monitoring.sbozh.me pointing to: ${hcloud_server.monitoring.ipv4_address}
  3. Wait for cloud-init to complete (5-10 min): ssh monitoring "cloud-init status --wait"
  4. Deploy GlitchTip: ./deploy.sh monitoring.sbozh.me

  EOT
}
