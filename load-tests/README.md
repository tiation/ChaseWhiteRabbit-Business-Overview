# Load Testing Documentation

This directory contains comprehensive load testing scripts and tools for the ChaseWhiteRabbit application using k6, a modern load testing framework.

## 🚀 Quick Start

```bash
# Install k6 (if not already installed)
brew install k6  # macOS
# or
sudo apt-get install k6  # Ubuntu/Debian

# Run a quick smoke test against staging
./run-tests.sh smoke staging

# Run a comprehensive load test
./run-tests.sh load staging
```

## 📁 Directory Structure

```
load-tests/
├── README.md                # This documentation
├── k6-config.json          # Configuration for environments and monitoring
├── run-tests.sh            # Main test runner script
├── smoke-test.js           # Quick validation test (1-2 minutes)
├── high-traffic-test.js    # Realistic load simulation (25-30 minutes)
├── stress-test.js          # System stress testing (30-35 minutes)
└── results/                # Test results and reports (created automatically)
```

## 🧪 Test Types

### 1. Smoke Test (`smoke-test.js`)
- **Purpose**: Quick validation of basic functionality
- **Duration**: 1-2 minutes
- **Load**: Minimal (1 virtual user)
- **Use Case**: CI/CD pipeline, pre-deployment validation

```bash
./run-tests.sh smoke staging
```

### 2. Load Test (`high-traffic-test.js`)
- **Purpose**: Realistic high traffic simulation
- **Duration**: 25-30 minutes
- **Load**: Up to 200 concurrent users with spike to 500
- **Use Case**: Performance validation, capacity planning

```bash
./run-tests.sh load staging
```

### 3. Stress Test (`stress-test.js`)
- **Purpose**: Push system beyond normal capacity
- **Duration**: 30-35 minutes
- **Load**: Up to 500 concurrent users
- **Use Case**: Finding breaking points, resilience testing

```bash
./run-tests.sh stress staging
```

## 🌍 Environments

### Staging (Default)
- **URL**: `https://staging.chasewhiterabbit.sxc.codes`
- **Purpose**: Primary testing environment
- **Access**: Safe for all testing scenarios

### Local Development
- **URL**: `http://localhost:3000`
- **Purpose**: Local development testing
- **Access**: Development only

```bash
./run-tests.sh smoke local
```

### Production (⚠️ Use with Extreme Caution)
- **URL**: `https://chasewhiterabbit.sxc.codes`
- **Purpose**: Production validation (emergency only)
- **Access**: Requires explicit confirmation

```bash
./run-tests.sh smoke production  # Will prompt for confirmation
```

## 🔧 Advanced Usage

### Custom Output Directory
```bash
./run-tests.sh load staging --output ./custom-results
```

### Different Report Formats
```bash
./run-tests.sh load staging --format json    # JSON output
./run-tests.sh load staging --format csv     # CSV output
./run-tests.sh load staging --format html    # HTML report (default)
```

### Environment Variables
```bash
# Custom base URL
BASE_URL=https://custom.example.com k6 run smoke-test.js

# InfluxDB integration for Grafana
INFLUXDB_URL=https://influxdb.sxc.codes/k6 ./run-tests.sh load staging
```

## 📊 Monitoring Integration

### Grafana Dashboards
Our load tests integrate with existing Grafana dashboards:

- **Application Performance**: Response times, throughput, error rates
- **Container Metrics**: CPU, memory, network usage
- **Error Rates & Reliability**: Error tracking and system health

**Access**: [https://grafana.sxc.codes](https://grafana.sxc.codes)

### Prometheus Metrics
Key metrics to monitor during tests:

- `http_request_duration_seconds`: Response time distribution
- `http_requests_total`: Request count and error rates
- `container_cpu_usage_seconds_total`: CPU utilization
- `container_memory_usage_bytes`: Memory consumption

**Access**: [https://prometheus.sxc.codes](https://prometheus.sxc.codes)

## 🚨 Alerts Configuration

Automated alerts are configured for:

- **Response Time**: 95th percentile > 2000ms
- **Error Rate**: > 5%
- **CPU Usage**: > 80%
- **Memory Usage**: > 85%

**Recipients**: 
- tiatheone@protonmail.com
- garrett@sxc.codes
- garrett.dillman@gmail.com

## 📈 Performance Thresholds

### Smoke Test
- Response time: 95% < 5s
- Error rate: < 10%
- Check success: > 90%

### Load Test
- Response time: 95% < 2s
- Error rate: < 5%
- Check success: > 95%

### Stress Test
- Response time: 95% < 10s
- Error rate: < 50% (expected degradation)
- Focus on system recovery

## 🏗️ CI/CD Integration

### GitLab CI Example
```yaml
performance_test:
  stage: test
  script:
    - cd load-tests
    - ./run-tests.sh smoke staging
  artifacts:
    reports:
      performance: load-tests/results/*.json
    paths:
      - load-tests/results/
    expire_in: 1 week
  only:
    - merge_requests
    - main
```

### GitHub Actions Example
```yaml
name: Performance Tests
on:
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install k6
        run: |
          sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6
      - name: Run smoke test
        run: cd load-tests && ./run-tests.sh smoke staging
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: performance-results
          path: load-tests/results/
```

## 🔍 Interpreting Results

### Key Metrics to Analyze

1. **Response Time Distribution**
   - Median (p50): Typical user experience
   - 95th percentile (p95): Worst-case acceptable performance
   - 99th percentile (p99): Outlier performance

2. **Throughput**
   - Requests per second (RPS)
   - Data transfer rates
   - Concurrent user capacity

3. **Error Rates**
   - HTTP 4xx errors: Client-side issues
   - HTTP 5xx errors: Server-side problems
   - Network errors: Infrastructure issues

4. **Resource Utilization**
   - CPU usage patterns
   - Memory consumption
   - Network bandwidth

### Sample Analysis Workflow

1. **Run the test**:
   ```bash
   ./run-tests.sh load staging
   ```

2. **Check immediate results** in terminal output

3. **Review HTML report** in `results/` directory

4. **Analyze Grafana dashboards** during and after test

5. **Identify bottlenecks**:
   - High response times → Application or database issues
   - High error rates → Capacity or configuration problems
   - High CPU/Memory → Resource constraints

6. **Implement optimizations** and retest

## 🛠️ Troubleshooting

### Common Issues

#### k6 Not Found
```bash
# macOS
brew install k6

# Ubuntu/Debian
curl -s https://dl.k6.io/key.gpg | sudo apt-key add -
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6
```

#### Application Not Accessible
- Check if the application is running
- Verify network connectivity
- Confirm URL and port configuration
- Check firewall settings

#### High Error Rates
- Review application logs
- Check database connections
- Monitor resource utilization
- Verify load balancer configuration

#### Poor Performance
- Analyze database query performance
- Check caching configuration
- Review application code for bottlenecks
- Monitor infrastructure resources

### Debug Mode
For detailed debugging, run k6 directly:

```bash
k6 run --env BASE_URL=https://staging.chasewhiterabbit.sxc.codes --verbose smoke-test.js
```

## 🚀 Performance Optimization Workflow

1. **Baseline Testing**
   ```bash
   ./run-tests.sh smoke staging  # Quick validation
   ./run-tests.sh load staging   # Full load test
   ```

2. **Identify Bottlenecks**
   - Review test results
   - Analyze Grafana dashboards
   - Check application logs

3. **Implement Optimizations**
   - Database query optimization
   - Caching strategies
   - Code refactoring
   - Infrastructure scaling

4. **Measure Impact**
   ```bash
   ./run-tests.sh load staging  # Retest after changes
   ```

5. **Repeat Until Satisfied**
   - Continue optimization cycle
   - Document improvements
   - Update performance baselines

## 📚 Additional Resources

- [k6 Documentation](https://k6.io/docs/)
- [Performance Testing Best Practices](https://k6.io/docs/testing-guides/performance-testing/)
- [Grafana Dashboard Creation](https://grafana.com/docs/grafana/latest/dashboards/)
- [Prometheus Monitoring](https://prometheus.io/docs/introduction/overview/)

## 🤝 Contributing

When adding new tests or modifying existing ones:

1. Follow the existing code structure
2. Add appropriate comments and documentation
3. Test against staging environment first
4. Update this README with any new features
5. Consider performance impact of test scripts themselves

## 📞 Support

For questions or issues with load testing:

- **Primary Contact**: tiatheone@protonmail.com
- **Technical Support**: garrett@sxc.codes
- **DevOps Issues**: Check monitoring dashboards first
- **Emergency**: Review alert configurations and escalation procedures
