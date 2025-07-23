# ChaseWhiteRabbit - Grafana Dashboards Guide

## Overview

This guide provides comprehensive information about the Grafana dashboards available for monitoring the ChaseWhiteRabbit platform. Our monitoring setup focuses on enterprise-grade observability with granular metrics for containers, performance, error rates, and autoscaling events.

## Accessing Grafana

### Primary Access
- **URL**: [grafana.sxc.codes](http://grafana.sxc.codes)
- **IP**: 153.92.214.1
- **Port**: 3000 (if needed)

### Authentication
- **Username**: `admin`
- **Password**: Contact system administrator (ensure default credentials are changed)
- **Note**: Enable 2FA for enhanced security in production environments

## Available Dashboards

### 1. ChaseWhiteRabbit Production Monitoring
**Location**: `tools/monitoring/grafana-dashboards.json`

**Purpose**: Main overview dashboard providing high-level system health metrics

**Key Panels**:
- Application Health Overview
- Request Rate and Response Time
- Error Rate tracking
- Database connections monitoring
- CPU and Memory usage by nodes
- Kubernetes pod status
- Network and Disk I/O

**Refresh Rate**: 30 seconds
**Recommended View**: 1 hour time range

### 2. Container Metrics & Health
**Location**: `config/monitoring/dashboards/container-metrics.json`

**Purpose**: Detailed container-level monitoring for Docker and Kubernetes environments

**Key Features**:
- **CPU Usage**: Real-time container CPU utilization with thresholds
- **Memory Usage**: Both percentage and absolute memory consumption
- **Network I/O**: Container network traffic monitoring
- **Filesystem Usage**: Container disk usage with alerts
- **Health Status**: Container health checks and restart counts
- **Start Time Distribution**: Container startup performance

**Alerts**:
- CPU usage > 80% (Warning), > 90% (Critical)
- Memory usage > 75% (Warning), > 90% (Critical)
- Filesystem usage > 70% (Warning), > 85% (Critical)

**Templates**:
- Filter by container name
- Filter by instance
- Multi-select support

### 3. Application Performance & Latency
**Location**: `config/monitoring/dashboards/application-performance.json`

**Purpose**: Deep dive into application performance metrics and request latencies

**Key Metrics**:
- **Request Latency Percentiles**: 50th, 90th, 95th, and 99th percentiles
- **Response Time by Endpoint**: Average response times per API endpoint
- **Request Rate**: Requests per second by service and method
- **Database Performance**: Query performance and operations per second
- **Queue Metrics**: Internal queue sizes and processing times
- **Cache Performance**: Hit rates and memory usage

**Performance Thresholds**:
- Response time > 0.5s (Warning), > 1s (Critical)
- Queue size > 500 (Warning), > 1000 (Critical)
- Cache hit rate < 80% (Warning), < 95% (Critical)

**Refresh Rate**: 10 seconds for real-time performance monitoring

### 4. Error Rates & Reliability
**Location**: `config/monitoring/dashboards/error-rates-reliability.json`

**Purpose**: Comprehensive error tracking and reliability metrics

**SLA Monitoring**:
- 24-hour, 7-day, and 30-day SLA compliance
- Mean Time Between Failures (MTBF)
- Mean Time To Recovery (MTTR)

**Error Tracking**:
- Error rate by service and status code
- Application errors over time (500, 502, 503, 504)
- Database connection errors and deadlocks
- Network errors and timeouts
- Container health issues

**Reliability Metrics**:
- Service availability percentages
- Failure pattern analysis
- Alert summary dashboard

**SLA Targets**:
- 99.9% uptime (Green)
- 99% uptime (Yellow)
- <99% uptime (Red)

### 5. Autoscaler Events & Resource Management
**Location**: `config/monitoring/dashboards/autoscaler-events.json`

**Purpose**: Kubernetes HPA monitoring and resource allocation tracking

**Scaling Insights**:
- HPA status and replica counts
- CPU and Memory utilization vs targets
- Scaling events timeline
- Resource requests vs limits
- Node resource pressure monitoring

**Resource Management**:
- Cluster resource allocation percentages
- Pod startup and termination times
- HPA decision timeline
- Resource pressure alerts

**Key Benefits**:
- Proactive scaling decision analysis
- Resource optimization insights
- Performance impact of scaling events

## Prometheus Configuration

### Updated Metrics Collection

The `prometheus.yml` configuration has been enhanced to collect additional metrics:

#### New Job Configurations:
1. **Container Health Checks**: Docker container health monitoring
2. **Application Performance**: Request latency and performance metrics
3. **Queue Metrics**: Internal queue sizes and processing times
4. **Kubernetes HPA**: Horizontal Pod Autoscaler events
5. **Container Health**: Docker container health status

#### Key Additions:
```yaml
# Request latency and performance metrics
- job_name: 'application-performance'
  scrape_interval: 10s
  scrape_timeout: 5s

# Internal queue monitoring
- job_name: 'queue-metrics'
  metrics_path: /metrics/queues
  scrape_interval: 15s

# Kubernetes autoscaler events
- job_name: 'kubernetes-hpa'
  scrape_interval: 30s

# Container health checks
- job_name: 'container-health'
  scrape_interval: 20s
```

## Alert Configuration

### Email Notifications
Alerts are configured to notify:
- tiatheone@protonmail.com
- garrett@sxc.codes
- garrett.dillman@gmail.com

### Alert Rules
Key alert rules are defined in `config/monitoring/alert-rules.yml`:

- **Infrastructure**: CPU, Memory, Disk usage alerts
- **Application**: Response time and error rate alerts
- **Database**: Connection and performance alerts
- **Kubernetes**: Pod and deployment health alerts

## Best Practices

### Dashboard Usage
1. **Start with Overview**: Use the main production dashboard for initial assessment
2. **Drill Down**: Use specific dashboards for detailed investigation
3. **Use Templates**: Leverage dashboard variables for focused monitoring
4. **Set Appropriate Time Ranges**: Match time ranges to investigation needs

### Performance Optimization
1. **Limit Time Ranges**: Avoid excessive historical data queries
2. **Use Recording Rules**: Pre-computed metrics for common queries
3. **Regular Cleanup**: Archive old metrics data periodically

### Security Considerations
1. **Change Default Credentials**: Update admin password immediately
2. **Enable HTTPS**: Use SSL/TLS for secure access
3. **Implement RBAC**: Role-based access control for different users
4. **Regular Updates**: Keep Grafana and plugins updated

## Troubleshooting

### Common Issues

#### Dashboard Not Loading
1. Check Prometheus data source connectivity
2. Verify metric names and labels
3. Review time range settings
4. Check Grafana logs for errors

#### Missing Metrics
1. Verify Prometheus scrape targets
2. Check application metrics endpoints
3. Review Prometheus configuration
4. Validate metric labels and names

#### Performance Issues
1. Reduce dashboard refresh rates
2. Limit concurrent dashboard users
3. Optimize Prometheus queries
4. Consider metric retention policies

### Support Contacts
- **Technical Issues**: tiatheone@protonmail.com
- **Infrastructure**: garrett@sxc.codes
- **General Support**: GitHub Issues

## Future Enhancements

### Planned Features
1. **Distributed Tracing**: Integration with Jaeger or Zipkin
2. **Log Correlation**: Direct links to ELK Stack logs
3. **Predictive Scaling**: ML-based scaling recommendations
4. **Cost Monitoring**: Resource cost tracking and optimization

### Dashboard Roadmap
1. **Business Metrics**: User engagement and business KPIs
2. **Security Monitoring**: Security events and compliance dashboards
3. **Mobile Dashboards**: Mobile-optimized monitoring views
4. **Custom Alerts**: User-defined alert conditions

---

*This documentation is part of the ChaseWhiteRabbit enterprise digital transformation initiative. For updates and additional resources, visit our documentation repository.*
