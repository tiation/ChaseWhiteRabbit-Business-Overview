# Network module for ChaseWhiteRabbit infrastructure

# VPC
resource "digitalocean_vpc" "main" {
  name     = "${var.project_name}-${var.environment}-vpc"
  region   = var.region
  ip_range = "10.10.0.0/16"
}

# Firewall rules
resource "digitalocean_firewall" "web" {
  name = "${var.project_name}-${var.environment}-web"

  droplet_ids = []

  # HTTP
  inbound_rule {
    protocol         = "tcp"
    port_range       = "80"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  # HTTPS
  inbound_rule {
    protocol         = "tcp"
    port_range       = "443"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  # SSH
  inbound_rule {
    protocol         = "tcp"
    port_range       = "22"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  # Kubernetes API
  inbound_rule {
    protocol         = "tcp"
    port_range       = "6443"
    source_addresses = ["10.10.0.0/16"]
  }

  # Prometheus
  inbound_rule {
    protocol         = "tcp"
    port_range       = "9090"
    source_addresses = ["10.10.0.0/16"]
  }

  # Grafana
  inbound_rule {
    protocol         = "tcp"
    port_range       = "3000"
    source_addresses = ["10.10.0.0/16"]
  }

  # ElasticSearch
  inbound_rule {
    protocol         = "tcp"
    port_range       = "9200"
    source_addresses = ["10.10.0.0/16"]
  }

  # All outbound traffic
  outbound_rule {
    protocol              = "tcp"
    port_range           = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "udp"
    port_range           = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }
}

# Load Balancer
resource "digitalocean_loadbalancer" "web" {
  name   = "${var.project_name}-${var.environment}-lb"
  region = var.region
  vpc_uuid = digitalocean_vpc.main.id

  forwarding_rule {
    entry_protocol  = "https"
    entry_port      = 443
    target_protocol = "http"
    target_port     = 80
    certificate_name = digitalocean_certificate.cert.name
  }

  forwarding_rule {
    entry_protocol  = "http"
    entry_port      = 80
    target_protocol = "http"
    target_port     = 80
  }

  healthcheck {
    protocol = "http"
    port     = 80
    path     = "/health"
  }
}

# SSL Certificate
resource "digitalocean_certificate" "cert" {
  name    = "${var.project_name}-${var.environment}-cert"
  type    = "lets_encrypt"
  domains = [
    "chasewhiterabbit.sxc.codes",
    "api.chasewhiterabbit.sxc.codes"
  ]
}
