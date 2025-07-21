#!/bin/sh
# ChaseWhiteRabbit Health Check Script
# Enterprise-grade health monitoring for container orchestration

set -e

# Configuration
HEALTH_ENDPOINT="http://localhost:8080/health"
TIMEOUT=3
MAX_RETRIES=3
RETRY_DELAY=1

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log_error() {
    echo "${RED}[ERROR]${NC} $1" >&2
}

log_success() {
    echo "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo "${YELLOW}[WARNING]${NC} $1"
}

# Function to check HTTP endpoint
check_http_endpoint() {
    local url=$1
    local expected_status=${2:-200}
    
    log "Checking HTTP endpoint: $url"
    
    local response
    response=$(curl -s -w "\n%{http_code}" --max-time $TIMEOUT "$url" 2>/dev/null || echo "000")
    
    local body=$(echo "$response" | head -n -1)
    local status_code=$(echo "$response" | tail -n1)
    
    if [ "$status_code" = "$expected_status" ]; then
        log_success "HTTP endpoint healthy (status: $status_code)"
        return 0
    else
        log_error "HTTP endpoint unhealthy (status: $status_code, expected: $expected_status)"
        return 1
    fi
}

# Function to check if nginx is running
check_nginx_process() {
    log "Checking nginx process..."
    
    if pgrep nginx > /dev/null; then
        log_success "Nginx process is running"
        return 0
    else
        log_error "Nginx process is not running"
        return 1
    fi
}

# Function to check disk space
check_disk_space() {
    log "Checking disk space..."
    
    local usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    local threshold=90
    
    if [ "$usage" -lt "$threshold" ]; then
        log_success "Disk space OK (${usage}% used)"
        return 0
    else
        log_warning "Disk space high (${usage}% used, threshold: ${threshold}%)"
        return 1
    fi
}

# Function to check memory usage
check_memory_usage() {
    log "Checking memory usage..."
    
    # Get memory info from /proc/meminfo
    local mem_total=$(awk '/MemTotal/ {print $2}' /proc/meminfo)
    local mem_available=$(awk '/MemAvailable/ {print $2}' /proc/meminfo)
    
    if [ -z "$mem_available" ]; then
        # Fallback for older systems
        local mem_free=$(awk '/MemFree/ {print $2}' /proc/meminfo)
        local buffers=$(awk '/Buffers/ {print $2}' /proc/meminfo)
        local cached=$(awk '/Cached/ {print $2}' /proc/meminfo)
        mem_available=$((mem_free + buffers + cached))
    fi
    
    local mem_usage=$((100 - (mem_available * 100 / mem_total)))
    local threshold=90
    
    if [ "$mem_usage" -lt "$threshold" ]; then
        log_success "Memory usage OK (${mem_usage}% used)"
        return 0
    else
        log_warning "Memory usage high (${mem_usage}% used, threshold: ${threshold}%)"
        return 1
    fi
}

# Main health check function
perform_health_check() {
    local checks_passed=0
    local total_checks=4
    
    log "Starting ChaseWhiteRabbit health check..."
    
    # Check nginx process
    if check_nginx_process; then
        checks_passed=$((checks_passed + 1))
    fi
    
    # Check HTTP endpoint with retries
    local retry_count=0
    while [ $retry_count -lt $MAX_RETRIES ]; do
        if check_http_endpoint "$HEALTH_ENDPOINT"; then
            checks_passed=$((checks_passed + 1))
            break
        else
            retry_count=$((retry_count + 1))
            if [ $retry_count -lt $MAX_RETRIES ]; then
                log "Retrying HTTP check ($retry_count/$MAX_RETRIES)..."
                sleep $RETRY_DELAY
            fi
        fi
    done
    
    # Check disk space
    if check_disk_space; then
        checks_passed=$((checks_passed + 1))
    fi
    
    # Check memory usage
    if check_memory_usage; then
        checks_passed=$((checks_passed + 1))
    fi
    
    # Determine overall health status
    if [ $checks_passed -eq $total_checks ]; then
        log_success "All health checks passed ($checks_passed/$total_checks)"
        exit 0
    elif [ $checks_passed -gt $((total_checks / 2)) ]; then
        log_warning "Partial health check failure ($checks_passed/$total_checks passed)"
        exit 1
    else
        log_error "Health check failed ($checks_passed/$total_checks passed)"
        exit 1
    fi
}

# Script execution
main() {
    case "${1:-check}" in
        "check")
            perform_health_check
            ;;
        "quick")
            check_http_endpoint "$HEALTH_ENDPOINT"
            ;;
        "process")
            check_nginx_process
            ;;
        "metrics")
            # Output health metrics in Prometheus format
            echo "# HELP chasewhiterabbit_health_check Health check status"
            echo "# TYPE chasewhiterabbit_health_check gauge"
            if perform_health_check > /dev/null 2>&1; then
                echo "chasewhiterabbit_health_check 1"
            else
                echo "chasewhiterabbit_health_check 0"
            fi
            ;;
        *)
            echo "Usage: $0 {check|quick|process|metrics}"
            echo "  check   - Full health check (default)"
            echo "  quick   - Quick HTTP endpoint check only"
            echo "  process - Check nginx process only"
            echo "  metrics - Output Prometheus metrics"
            exit 1
            ;;
    esac
}

# Run the script
main "$@"
