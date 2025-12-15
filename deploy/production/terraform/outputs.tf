output "server_ip" {
  description = "Public IPv4 address of the server"
  value       = hcloud_server.sbozh_me.ipv4_address
}

output "server_ipv6" {
  description = "Public IPv6 address of the server"
  value       = hcloud_server.sbozh_me.ipv6_address
}

output "server_name" {
  description = "Server name"
  value       = hcloud_server.sbozh_me.name
}

output "volume_path" {
  description = "Volume mount path"
  value       = "/mnt/sbozh-me-data"
}

output "ssh_command" {
  description = "SSH command to connect to the server"
  value       = "ssh oktavian@${hcloud_server.sbozh_me.ipv4_address}"
}

output "next_steps" {
  description = "Next steps after infrastructure is created"
  value = <<-EOT

  ✅ Infrastructure Created Successfully!

  📍 Server IP: ${hcloud_server.sbozh_me.ipv4_address}
  🔗 SSH: ssh oktavian@${hcloud_server.sbozh_me.ipv4_address}

  🔒 Security:
  - User: oktavian (with sudo access)
  - Root SSH login: disabled
  - Password auth: disabled (SSH keys only)
  - Root console access: available with password from tfvars

  Next Steps:
  1. Point your domain to: ${hcloud_server.sbozh_me.ipv4_address}
  2. Wait for cloud-init to complete (5-10 min): ssh oktavian@${hcloud_server.sbozh_me.ipv4_address} "cloud-init status --wait"
  3. Deploy application: ./deploy.sh ${hcloud_server.sbozh_me.ipv4_address}

  EOT
}
