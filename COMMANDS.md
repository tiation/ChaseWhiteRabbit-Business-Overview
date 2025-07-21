# Command History Reference

The following commands were used to create and set up this enterprise-grade digital transformation initiative:

## Setup Commands

### Repository Initialization
```bash
# Initialize Git repository with enterprise-grade documentation
git init
git add README.md PROJECT_OVERVIEW.md
git commit -m "Initial commit: Enterprise-grade project documentation"

# Create comprehensive project structure
git add .
git commit -m "🚀 Enterprise-grade repository improvements"

# Create public GitHub repository
gh repo create ChaseWhiteRabbit-Business-Overview --public \
  --description "🐰 Enterprise-grade digital transformation initiative modernizing beloved legacy applications while preserving their essence. Showcasing cloud-native DevOps practices for gaming community platforms." \
  --source . --remote origin

# Push to GitHub
git push -u origin main
```

### Development Environment Setup
```bash
# Copy environment configuration
cp config/env.example config/.env

# Start development environment with full observability stack
docker-compose up -d

# View running services
docker-compose ps

# Check application logs
docker-compose logs -f app

# Access services locally
open http://localhost:3000      # Main application
open http://localhost:3001      # Grafana dashboards
open http://localhost:9090      # Prometheus metrics
open http://localhost:5601      # Kibana logs
```

### Infrastructure Commands
```bash
# Build Docker images
docker build -t chasewhiterabbit:latest .

# Tag for registry
docker tag chasewhiterabbit:latest docker.sxc.codes/chasewhiterabbit:latest

# Push to private registry
docker push docker.sxc.codes/chasewhiterabbit:latest

# Deploy with Helm (when charts are ready)
helm upgrade --install chasewhiterabbit ./infrastructure/helm/chasewhiterabbit \
  --namespace chasewhiterabbit-dev \
  --create-namespace \
  --set environment=development
```

### Monitoring & Observability
```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Query custom metrics
curl "http://localhost:9090/api/v1/query?query=chasewhiterabbit:dice_rolls:rate5m"

# Check Elasticsearch indices
curl http://localhost:9200/_cat/indices

# View Grafana datasources
curl -H "Authorization: Bearer $GRAFANA_API_TOKEN" \
  http://localhost:3001/api/datasources
```

## Usage Examples

### Development Workflow
```bash
# Start development environment
docker-compose up -d

# Run tests
npm test
npm run test:integration

# Performance testing
k6 run tests/performance/baseline.js

# Security scanning
docker run --rm -v $(pwd):/app aquasec/trivy:latest fs /app

# Code quality checks
npm run lint
npm run format
```

### CI/CD Pipeline
```bash
# Trigger GitLab pipeline (when integrated with gitlab.sxc.codes)
git push origin feature/new-feature

# Manual deployment to staging
curl -X POST \
  -H "Private-Token: $GITLAB_TOKEN" \
  "https://gitlab.sxc.codes/api/v4/projects/$PROJECT_ID/pipeline" \
  -d "ref=main&variables[DEPLOY_ENV]=staging"

# Production deployment (requires manual approval)
git tag v1.0.0
git push origin v1.0.0
```

### Infrastructure Management
```bash
# SSH into infrastructure hosts
ssh root@docker.sxc.codes
ssh root@helm.sxc.codes
ssh root@grafana.sxc.codes
ssh root@elastic.sxc.codes

# Monitor infrastructure health
curl -s http://helm.sxc.codes:9100/metrics | grep node_load
curl -s http://docker.sxc.codes:9100/metrics | grep node_memory

# Check Kubernetes cluster (when deployed)
kubectl get pods -n chasewhiterabbit-prod
kubectl logs -f deployment/chasewhiterabbit -n chasewhiterabbit-prod
kubectl describe hpa chasewhiterabbit -n chasewhiterabbit-prod
```

### Database Operations
```bash
# Connect to Supabase PostgreSQL
psql $DATABASE_URL

# Redis operations
redis-cli -h redis ping
redis-cli -h redis monitor

# Backup operations
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
redis-cli --rdb backup_$(date +%Y%m%d).rdb
```

### Log Analysis
```bash
# View application logs
docker-compose logs -f app

# Query Elasticsearch
curl -X GET "localhost:9200/chasewhiterabbit-*/_search" \
  -H 'Content-Type: application/json' \
  -d '{"query": {"match": {"level": "error"}}}'

# Export logs for analysis
docker-compose logs app > application_logs_$(date +%Y%m%d).log
```

### Performance Monitoring
```bash
# Check response times
curl -w "@curl-format.txt" -s -o /dev/null http://localhost:3000/api/health

# Load testing with K6
k6 run --vus 10 --duration 30s tests/performance/load-test.js

# Memory and CPU usage
docker stats chasewhiterabbit-app

# Network monitoring
ss -tuln | grep :3000
netstat -i
```

### Security Operations
```bash
# Vulnerability scanning
docker run --rm -v $(pwd):/app aquasec/trivy:latest fs /app

# Secret detection
trufflehog filesystem --directory=. --fail

# SSL certificate check
openssl s_client -connect chasewhiterabbit.sxc.codes:443 -servername chasewhiterabbit.sxc.codes

# Security headers test
curl -I https://chasewhiterabbit.sxc.codes
```

### Backup and Recovery
```bash
# Create backup
./scripts/backup/create-backup.sh

# Restore from backup
./scripts/backup/restore-backup.sh backup_20240121.tar.gz

# Database backup
pg_dump $DATABASE_URL | gzip > db_backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Configuration backup
tar -czf config_backup_$(date +%Y%m%d).tar.gz config/ infrastructure/
```

### Maintenance Tasks
```bash
# Update dependencies
npm update
docker-compose pull

# Clean up Docker
docker system prune -f
docker volume prune -f

# Log rotation
logrotate /etc/logrotate.d/chasewhiterabbit

# Certificate renewal (when using custom certs)
certbot renew --nginx
```

## Troubleshooting Commands

### Common Issues
```bash
# Check service health
curl http://localhost:3000/health
docker-compose ps
docker-compose logs

# Network debugging
docker network ls
docker network inspect chasewhiterabbit-network

# Database connection test
pg_isready -h supabase.sxc.codes -p 5432

# Redis connection test
redis-cli -h localhost -p 6379 ping

# Prometheus query debugging
curl "http://localhost:9090/api/v1/label/__name__/values"
```

### Emergency Procedures
```bash
# Emergency stop
docker-compose down

# Rollback deployment
kubectl rollout undo deployment/chasewhiterabbit -n chasewhiterabbit-prod

# Scale down under load
kubectl scale deployment chasewhiterabbit --replicas=1 -n chasewhiterabbit-prod

# Database emergency backup
pg_dump $DATABASE_URL > emergency_backup_$(date +%Y%m%d_%H%M%S).sql
```

---

## Infrastructure Hosts Reference

| Host | Purpose | SSH Command | Health Check |
|------|---------|-------------|--------------|
| helm.sxc.codes | Helm charts & K8s | `ssh root@145.223.21.248` | `curl http://145.223.21.248:9100/metrics` |
| docker.sxc.codes | CI/CD runner | `ssh root@145.223.22.7` | `curl http://145.223.22.7:9100/metrics` |
| gitlab.sxc.codes | Git CI/CD | `ssh root@145.223.22.10` | `curl http://145.223.22.10:9100/metrics` |
| grafana.sxc.codes | Dashboards | `ssh root@153.92.214.1` | `curl http://153.92.214.1:3000/api/health` |
| elastic.sxc.codes | Log aggregation | `ssh root@145.223.22.14` | `curl http://145.223.22.14:9200/_cluster/health` |
| supabase.sxc.codes | Database | `ssh root@93.127.167.157` | `curl http://93.127.167.157:8000/health` |
| ubuntu.sxc.codes | General purpose | `ssh root@89.116.191.60` | `curl http://89.116.191.60:9100/metrics` |

---

*This command reference ensures consistent operations across development, staging, and production environments for the ChaseWhiteRabbit digital transformation initiative.*
