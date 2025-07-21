# Main Terraform configuration for ChaseWhiteRabbit infrastructure
terraform {
  required_version = ">= 1.0"
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.0"
    }
  }
  
  backend "s3" {
    bucket = "chasewhiterabbit-terraform-state"
    key    = "infrastructure/terraform.tfstate"
    region = "us-east-1"
  }
}

# Configure the DigitalOcean Provider
provider "digitalocean" {
  token = var.do_token
}

# Data sources
data "digitalocean_kubernetes_versions" "current" {
  version_prefix = "1.28."
}

# Local variables
locals {
  project_name = "chasewhiterabbit"
  environment  = var.environment
  
  common_tags = {
    Project     = local.project_name
    Environment = local.environment
    ManagedBy   = "terraform"
    Owner       = "tiatheone@protonmail.com"
  }
}

# Network module
module "network" {
  source = "./modules/network"
  
  project_name = local.project_name
  environment  = local.environment
  tags        = local.common_tags
}

# Kubernetes cluster module
module "k8s" {
  source = "./modules/k8s"
  
  project_name    = local.project_name
  environment     = local.environment
  tags           = local.common_tags
  vpc_uuid       = module.network.vpc_id
  k8s_version    = data.digitalocean_kubernetes_versions.current.latest_version
}

# Compute module
module "compute" {
  source = "./modules/compute"
  
  project_name = local.project_name
  environment  = local.environment
  tags        = local.common_tags
  vpc_uuid    = module.network.vpc_id
}

# Database module
module "database" {
  source = "./modules/database"
  
  project_name = local.project_name
  environment  = local.environment
  tags        = local.common_tags
  vpc_uuid    = module.network.vpc_id
}
