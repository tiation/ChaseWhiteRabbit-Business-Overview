#!/bin/bash

# ChaseWhiteRabbit Backup Automation Script
# This script automates the backup process for databases, configurations, and persistent data

set -euo pipefail

# Configuration
BACKUP_DATE=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_DIR="/opt/backups/chasewhiterabbit/$BACKUP_DATE"
RETENTION_DAYS=30
LOG_FILE="/var/log/chasewhiterabbit-backup.log"
ALERT_EMAILS=("tiatheone@protonmail.com" "garrett@sxc.codes" "garrett.dillman@gmail.com")

# S3 Configuration for backup storage
S3_BUCKET="chasewhiterabbit-backups"
S3_PREFIX="production"

# Database Configuration
DB_HOST="supabase.sxc.codes"
DB_NAME="chasewhiterabbit"
DB_USER="backup_user"

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Send alert function
send_alert() {
    local subject="$1"
    local message="$2"
    local priority="$3"
    
    for email in "${ALERT_EMAILS[@]}"; do
        echo "$message" | mail -s "[$priority] ChaseWhiteRabbit Backup: $subject" "$email"
    done
}

# Create backup directory
create_backup_dir() {
    log "Creating backup directory: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
}

# Database backup function
backup_database() {
    log "Starting database backup..."
    
    local db_backup_file="$BACKUP_DIR/database_${BACKUP_DATE}.sql"
    
    if pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" --no-password > "$db_backup_file"; then
        log "Database backup completed successfully"
        gzip "$db_backup_file"
    else
        log "ERROR: Database backup failed"
        send_alert "Database Backup Failed" "Database backup failed for $BACKUP_DATE" "CRITICAL"
        exit 1
    fi
}

# Kubernetes configuration backup
backup_k8s_config() {
    log "Starting Kubernetes configuration backup..."
    
    local k8s_backup_dir="$BACKUP_DIR/kubernetes"
    mkdir -p "$k8s_backup_dir"
    
    # Backup all resources in chasewhiterabbit namespace
    kubectl get all,configmaps,secrets,ingress,pvc -n chasewhiterabbit -o yaml > "$k8s_backup_dir/chasewhiterabbit-namespace.yaml"
    
    # Backup Helm values
    helm get values chasewhiterabbit -n chasewhiterabbit > "$k8s_backup_dir/helm-values.yaml"
    
    log "Kubernetes configuration backup completed"
}

# Application data backup
backup_app_data() {
    log "Starting application data backup..."
    
    local app_backup_dir="$BACKUP_DIR/application"
    mkdir -p "$app_backup_dir"
    
    # Backup persistent volume claims
    kubectl exec -n chasewhiterabbit deployment/chasewhiterabbit -- tar czf - /app/data | cat > "$app_backup_dir/app-data.tar.gz"
    
    log "Application data backup completed"
}

# Upload to S3
upload_to_s3() {
    log "Uploading backup to S3..."
    
    local backup_archive="$BACKUP_DIR.tar.gz"
    tar czf "$backup_archive" -C "$(dirname "$BACKUP_DIR")" "$(basename "$BACKUP_DIR")"
    
    if aws s3 cp "$backup_archive" "s3://$S3_BUCKET/$S3_PREFIX/$(basename "$backup_archive")"; then
        log "Backup uploaded to S3 successfully"
        rm -rf "$BACKUP_DIR" "$backup_archive"
    else
        log "ERROR: Failed to upload backup to S3"
        send_alert "S3 Upload Failed" "Failed to upload backup $BACKUP_DATE to S3" "HIGH"
        exit 1
    fi
}

# Clean old backups
cleanup_old_backups() {
    log "Cleaning up old backups..."
    
    aws s3 ls "s3://$S3_BUCKET/$S3_PREFIX/" | while read -r line; do
        backup_date=$(echo "$line" | awk '{print $1" "$2}')
        backup_file=$(echo "$line" | awk '{print $4}')
        
        if [[ -n "$backup_file" ]]; then
            backup_timestamp=$(date -d "$backup_date" +%s)
            cutoff_timestamp=$(date -d "$RETENTION_DAYS days ago" +%s)
            
            if [[ $backup_timestamp -lt $cutoff_timestamp ]]; then
                log "Deleting old backup: $backup_file"
                aws s3 rm "s3://$S3_BUCKET/$S3_PREFIX/$backup_file"
            fi
        fi
    done
}

# Verify backup integrity
verify_backup() {
    log "Verifying backup integrity..."
    
    # Download and verify the backup
    local test_file="/tmp/backup_test_${BACKUP_DATE}.tar.gz"
    aws s3 cp "s3://$S3_BUCKET/$S3_PREFIX/$(basename "$BACKUP_DIR").tar.gz" "$test_file"
    
    if tar tzf "$test_file" >/dev/null 2>&1; then
        log "Backup integrity verification successful"
        rm -f "$test_file"
    else
        log "ERROR: Backup integrity verification failed"
        send_alert "Backup Verification Failed" "Backup integrity verification failed for $BACKUP_DATE" "HIGH"
        exit 1
    fi
}

# Main backup process
main() {
    log "Starting ChaseWhiteRabbit backup process"
    
    create_backup_dir
    backup_database
    backup_k8s_config
    backup_app_data
    upload_to_s3
    cleanup_old_backups
    verify_backup
    
    log "Backup process completed successfully"
    send_alert "Backup Completed" "Backup completed successfully for $BACKUP_DATE" "INFO"
}

# Error handler
error_handler() {
    local line_number=$1
    log "ERROR: Script failed at line $line_number"
    send_alert "Backup Script Failed" "Backup script failed at line $line_number on $BACKUP_DATE" "CRITICAL"
    exit 1
}

# Set error handler
trap 'error_handler $LINENO' ERR

# Run main function
main
