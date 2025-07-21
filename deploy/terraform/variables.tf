# Variables for ChaseWhiteRabbit Terraform infrastructure

variable "do_token" {
  description = "DigitalOcean API token"
  type        = string
  sensitive   = true
}

variable "environment" {
  description = "Environment name (production, staging, development)"
  type        = string
  default     = "production"
  
  validation {
    condition     = contains(["production", "staging", "development"], var.environment)
    error_message = "Environment must be one of: production, staging, development."
  }
}

variable "region" {
  description = "DigitalOcean region"
  type        = string
  default     = "nyc1"
}

variable "node_count" {
  description = "Number of nodes in the Kubernetes cluster"
  type        = number
  default     = 3
}

variable "node_size" {
  description = "Size of the Kubernetes cluster nodes"
  type        = string
  default     = "s-2vcpu-4gb"
}

variable "database_size" {
  description = "Size of the database cluster"
  type        = string
  default     = "db-s-1vcpu-1gb"
}

variable "enable_monitoring" {
  description = "Enable monitoring stack"
  type        = bool
  default     = true
}

variable "enable_logging" {
  description = "Enable logging stack"
  type        = bool
  default     = true
}

variable "alert_emails" {
  description = "Email addresses for alerts"
  type        = list(string)
  default     = [
    "tiatheone@protonmail.com",
    "garrett@sxc.codes", 
    "garrett.dillman@gmail.com"
  ]
}

variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 30
}
