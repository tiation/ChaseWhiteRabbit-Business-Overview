#!/bin/bash
# GitHub Secrets Management Script
# Manages repository secrets using GitHub CLI

set -euo pipefail

# Configuration
REPO_OWNER="tiation"
REPO_NAME="ChaseWhiteRabbit-Business-Overview"
ENVIRONMENT="${1:-production}"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if GitHub CLI is installed and authenticated
check_prerequisites() {
    if ! command -v gh &> /dev/null; then
        log_error "GitHub CLI (gh) is not installed. Please install it first."
        exit 1
    fi

    if ! gh auth status &> /dev/null; then
        log_error "GitHub CLI is not authenticated. Please run 'gh auth login' first."
        exit 1
    fi
}

# Generate secure random password
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
}

# Generate API key
generate_api_key() {
    echo "cwr_$(openssl rand -hex 16)"
}

# Generate JWT secret
generate_jwt_secret() {
    openssl rand -base64 64 | tr -d "\n"
}

# Set repository secret
set_secret() {
    local secret_name="$1"
    local secret_value="$2"
    local environment="$3"

    if [ "$environment" = "repository" ]; then
        gh secret set "$secret_name" --body "$secret_value" --repo "$REPO_OWNER/$REPO_NAME"
    else
        gh secret set "$secret_name" --body "$secret_value" --repo "$REPO_OWNER/$REPO_NAME" --env "$environment"
    fi

    log_info "Secret '$secret_name' updated for $environment"
}

# Rotate database secrets
rotate_database_secrets() {
    local env="$1"
    
    log_info "Rotating database secrets for $env environment..."
    
    # Generate new database credentials
    local db_password=$(generate_password)
    local db_admin_password=$(generate_password)
    
    set_secret "DB_PASSWORD" "$db_password" "$env"
    set_secret "DB_ADMIN_PASSWORD" "$db_admin_password" "$env"
    
    # Update database users (this would typically call your database management scripts)
    log_info "Database secrets rotated successfully"
}

# Rotate API secrets
rotate_api_secrets() {
    local env="$1"
    
    log_info "Rotating API secrets for $env environment..."
    
    # Generate new API credentials
    local api_key=$(generate_api_key)
    local api_secret=$(generate_password)
    local jwt_secret=$(generate_jwt_secret)
    
    set_secret "API_KEY" "$api_key" "$env"
    set_secret "API_SECRET" "$api_secret" "$env"
    set_secret "JWT_SECRET" "$jwt_secret" "$env"
    
    log_info "API secrets rotated successfully"
}

# Rotate third-party service tokens
rotate_service_tokens() {
    local env="$1"
    
    log_info "Rotating service tokens for $env environment..."
    
    # Note: In a real implementation, you'd call the respective APIs to generate new tokens
    log_warn "Service token rotation requires manual intervention for:"
    log_warn "- GRAFANA_API_TOKEN"
    log_warn "- ELASTIC_API_KEY"  
    log_warn "- VAULT_TOKEN"
    log_warn "- SLACK_WEBHOOK_URL"
    
    # Placeholder for automated token generation
    # set_secret "GRAFANA_API_TOKEN" "$(generate_grafana_token)" "$env"
    # set_secret "ELASTIC_API_KEY" "$(generate_elastic_key)" "$env"
}

# Main rotation function
rotate_secrets() {
    local environment="$1"
    
    log_info "Starting secrets rotation for $environment environment..."
    
    case "$environment" in
        "all")
            rotate_secrets "development"
            rotate_secrets "staging"
            rotate_secrets "production"
            ;;
        "development"|"staging"|"production")
            rotate_database_secrets "$environment"
            rotate_api_secrets "$environment"
            rotate_service_tokens "$environment"
            ;;
        *)
            log_error "Invalid environment: $environment"
            log_info "Valid environments: development, staging, production, all"
            exit 1
            ;;
    esac
    
    log_info "Secrets rotation completed for $environment"
}

# List current secrets (without values)
list_secrets() {
    log_info "Repository secrets:"
    gh secret list --repo "$REPO_OWNER/$REPO_NAME"
}

# Backup secrets metadata
backup_secrets_metadata() {
    local backup_file="secrets-backup-$(date +%Y%m%d-%H%M%S).json"
    
    log_info "Creating secrets metadata backup..."
    
    # Create backup of secret names and metadata (not values)
    gh secret list --repo "$REPO_OWNER/$REPO_NAME" --json name,created_at,updated_at > "$backup_file"
    
    log_info "Backup created: $backup_file"
}

# Validate secrets after rotation
validate_secrets() {
    local environment="$1"
    
    log_info "Validating secrets for $environment environment..."
    
    # Check if required secrets exist
    local required_secrets=(
        "DB_PASSWORD"
        "DB_ADMIN_PASSWORD"
        "API_KEY"
        "API_SECRET"
        "JWT_SECRET"
    )
    
    for secret in "${required_secrets[@]}"; do
        if gh secret list --repo "$REPO_OWNER/$REPO_NAME" | grep -q "$secret"; then
            log_info "✓ $secret exists"
        else
            log_error "✗ $secret missing"
        fi
    done
}

# Main script logic
main() {
    check_prerequisites
    
    case "${1:-help}" in
        "rotate")
            rotate_secrets "${2:-production}"
            ;;
        "list")
            list_secrets
            ;;
        "backup")
            backup_secrets_metadata
            ;;
        "validate")
            validate_secrets "${2:-production}"
            ;;
        "help"|*)
            echo "GitHub Secrets Management Script"
            echo ""
            echo "Usage: $0 <command> [environment]"
            echo ""
            echo "Commands:"
            echo "  rotate [env]    Rotate secrets for environment (development|staging|production|all)"
            echo "  list            List all repository secrets"
            echo "  backup          Create backup of secrets metadata"
            echo "  validate [env]  Validate secrets exist for environment"
            echo "  help            Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 rotate production"
            echo "  $0 rotate all"
            echo "  $0 list"
            echo "  $0 validate staging"
            ;;
    esac
}

# Run main function with all arguments
main "$@"
