#!/bin/bash

# Load Testing Runner Script for ChaseWhiteRabbit
# Usage: ./run-tests.sh [test-type] [environment] [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
TEST_TYPE="smoke"
ENVIRONMENT="staging"
OUTPUT_DIR="./results"
REPORT_FORMAT="html"

# Function to display usage
usage() {
    echo -e "${BLUE}ChaseWhiteRabbit Load Testing Runner${NC}"
    echo ""
    echo "Usage: $0 [test-type] [environment] [options]"
    echo ""
    echo "Test Types:"
    echo "  smoke      - Quick validation (1-2 minutes)"
    echo "  load       - High traffic simulation (25-30 minutes)"
    echo "  stress     - System stress test (30-35 minutes)"
    echo ""
    echo "Environments:"
    echo "  local      - http://localhost:3000"
    echo "  staging    - https://staging.chasewhiterabbit.sxc.codes"
    echo "  production - https://chasewhiterabbit.sxc.codes"
    echo ""
    echo "Options:"
    echo "  -o, --output DIR     Output directory for results (default: ./results)"
    echo "  -f, --format FORMAT  Report format: html, json, csv (default: html)"
    echo "  -h, --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 smoke staging"
    echo "  $0 load staging --output ./test-results"
    echo "  $0 stress staging --format json"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        smoke|load|stress)
            TEST_TYPE="$1"
            shift
            ;;
        local|staging|production)
            ENVIRONMENT="$1"
            shift
            ;;
        -o|--output)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        -f|--format)
            REPORT_FORMAT="$2"
            shift 2
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            usage
            exit 1
            ;;
    esac
done

# Set base URL based on environment
case $ENVIRONMENT in
    local)
        BASE_URL="http://localhost:3000"
        ;;
    staging)
        BASE_URL="https://staging.chasewhiterabbit.sxc.codes"
        ;;
    production)
        BASE_URL="https://chasewhiterabbit.sxc.codes"
        echo -e "${YELLOW}WARNING: Running tests against PRODUCTION environment!${NC}"
        echo -e "${YELLOW}Make sure you have proper authorization and monitoring in place.${NC}"
        read -p "Continue? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Aborted."
            exit 1
        fi
        ;;
esac

# Set test script based on type
case $TEST_TYPE in
    smoke)
        SCRIPT="smoke-test.js"
        ;;
    load)
        SCRIPT="high-traffic-test.js"
        ;;
    stress)
        SCRIPT="stress-test.js"
        ;;
esac

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo -e "${RED}k6 is not installed. Please install it first:${NC}"
    echo "  macOS: brew install k6"
    echo "  Linux: sudo apt-get install k6"
    echo "  Or visit: https://k6.io/docs/getting-started/installation/"
    exit 1
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Generate timestamp for unique file names
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
OUTPUT_FILE="$OUTPUT_DIR/${TEST_TYPE}-${ENVIRONMENT}-${TIMESTAMP}"

# Display test information
echo -e "${BLUE}Starting Load Test${NC}"
echo -e "Test Type: ${GREEN}$TEST_TYPE${NC}"
echo -e "Environment: ${GREEN}$ENVIRONMENT${NC}"
echo -e "Base URL: ${GREEN}$BASE_URL${NC}"
echo -e "Script: ${GREEN}$SCRIPT${NC}"
echo -e "Output: ${GREEN}$OUTPUT_FILE${NC}"
echo ""

# Pre-flight check
echo -e "${YELLOW}Running pre-flight checks...${NC}"
if curl -s --connect-timeout 10 "$BASE_URL/health" > /dev/null; then
    echo -e "${GREEN}✓ Application is accessible${NC}"
else
    echo -e "${RED}✗ Application health check failed${NC}"
    echo -e "${YELLOW}Continuing anyway (application might not have /health endpoint)${NC}"
fi

# Run the test
echo -e "${YELLOW}Running $TEST_TYPE test...${NC}"
echo ""

# Set up k6 command with appropriate options
K6_CMD="k6 run"
K6_CMD="$K6_CMD --env BASE_URL=$BASE_URL"

# Add output options based on format
case $REPORT_FORMAT in
    html)
        K6_CMD="$K6_CMD --out json=$OUTPUT_FILE.json"
        ;;
    json)
        K6_CMD="$K6_CMD --out json=$OUTPUT_FILE.json"
        ;;
    csv)
        K6_CMD="$K6_CMD --out csv=$OUTPUT_FILE.csv"
        ;;
esac

# Add InfluxDB output if available (for Grafana integration)
if [ ! -z "$INFLUXDB_URL" ]; then
    K6_CMD="$K6_CMD --out influxdb=$INFLUXDB_URL"
fi

# Execute the test
$K6_CMD "$SCRIPT"

# Test completion
echo ""
echo -e "${GREEN}Test completed successfully!${NC}"
echo ""

# Generate HTML report if JSON output was created
if [ -f "$OUTPUT_FILE.json" ] && [ "$REPORT_FORMAT" = "html" ]; then
    echo -e "${YELLOW}Generating HTML report...${NC}"
    
    # Create simple HTML report
    cat > "$OUTPUT_FILE.html" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Load Test Report - $TEST_TYPE ($ENVIRONMENT)</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .metrics { display: flex; flex-wrap: wrap; margin: 20px 0; }
        .metric { background: #f9f9f9; margin: 10px; padding: 15px; border-radius: 5px; min-width: 200px; }
        .metric h3 { margin: 0 0 10px 0; color: #333; }
        .metric .value { font-size: 24px; font-weight: bold; color: #007cba; }
        .success { color: #28a745; }
        .warning { color: #ffc107; }
        .error { color: #dc3545; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Load Test Report</h1>
        <p><strong>Test Type:</strong> $TEST_TYPE</p>
        <p><strong>Environment:</strong> $ENVIRONMENT</p>
        <p><strong>Base URL:</strong> $BASE_URL</p>
        <p><strong>Timestamp:</strong> $(date)</p>
    </div>
    
    <h2>Test Results</h2>
    <p>Detailed metrics are available in the JSON file: <code>$OUTPUT_FILE.json</code></p>
    
    <div class="metrics">
        <div class="metric">
            <h3>Test Status</h3>
            <div class="value success">Completed</div>
        </div>
    </div>
    
    <h2>Monitoring Links</h2>
    <ul>
        <li><a href="https://grafana.sxc.codes" target="_blank">Grafana Dashboards</a></li>
        <li><a href="https://prometheus.sxc.codes" target="_blank">Prometheus Metrics</a></li>
    </ul>
    
    <h2>Next Steps</h2>
    <ol>
        <li>Review the detailed JSON results</li>
        <li>Check Grafana dashboards for system behavior during the test</li>
        <li>Analyze any performance bottlenecks identified</li>
        <li>Consider implementing optimizations based on findings</li>
    </ol>
</body>
</html>
EOF
    
    echo -e "${GREEN}HTML report generated: $OUTPUT_FILE.html${NC}"
fi

# Display summary
echo -e "${BLUE}Summary:${NC}"
echo -e "Results saved to: ${GREEN}$OUTPUT_DIR/${NC}"
echo -e "Monitor performance at: ${GREEN}https://grafana.sxc.codes${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Review test results and metrics"
echo "2. Check Grafana dashboards for system behavior"
echo "3. Identify performance bottlenecks"
echo "4. Implement optimizations as needed"
