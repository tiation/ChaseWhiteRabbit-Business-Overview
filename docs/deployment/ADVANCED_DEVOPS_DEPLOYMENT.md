# Advanced DevOps Infrastructure Deployment Guide

This guide provides comprehensive instructions for deploying the Advanced DevOps Infrastructure for ChaseWhiteRabbit, including Kubernetes manifests, Helm charts, Terraform modules, monitoring, logging, and disaster recovery.

## Prerequisites

### Required Tools
- `kubectl` (Kubernetes CLI)
- `helm` (Helm package manager)
- `terraform` (Infrastructure as Code)
- `docker` (Container runtime)
- `aws-cli` (For S3 backup storage)

### Required Access
- DigitalOcean account with API token
- Kubernetes cluster access
- Helm chart repository access (helm.sxc.codes)
- GitLab CI/CD access (gitlab.sxc.codes)

## Infrastructure Components

### 1. Kubernetes Manifests (`deploy/kubernetes/`)

The Kubernetes manifests provide core application deployment configuration:

- **Namespace**: Isolates application resources
- **Deployment**: Manages application pods with rolling updates
- **Service**: Exposes application internally
- **Ingress**: Handles external traffic with SSL termination
- **ConfigMap**: Stores application configuration

**Deploy Kubernetes manifests:**
```bash
# Apply all Kubernetes manifests
kubectl apply -f deploy/kubernetes/

# Verify deployment
kubectl get all -n chasewhiterabbit
```

### 2. Helm Charts (`deploy/helm-charts/`)

Helm charts provide templated, configurable deployments:

**Install with Helm:**
```bash
# Add dependencies
helm dependency update deploy/helm-charts/

# Install or upgrade
helm upgrade --install chasewhiterabbit deploy/helm-charts/ \
  --namespace chasewhiterabbit \
  --create-namespace \
  --values deploy/helm-charts/values.yaml

# Verify installation
helm status chasewhiterabbit -n chasewhiterabbit
```

**Publish to Helm repository:**
```bash
# Package chart
helm package deploy/helm-charts/

# Upload to helm.sxc.codes
curl --data-binary "@chasewhiterabbit-0.1.0.tgz" \
  https://helm.sxc.codes/api/charts
```

### 3. Terraform Infrastructure (`deploy/terraform/`)

Terraform manages all cloud infrastructure as code:

**Initialize and deploy:**
```bash
cd deploy/terraform

# Initialize Terraform
terraform init

# Plan infrastructure changes
terraform plan -var="do_token=${DO_TOKEN}"

# Apply changes (requires approval)
terraform apply -var="do_token=${DO_TOKEN}"

# Verify infrastructure
terraform show
```

**GitLab CI/CD Integration:**
The `.gitlab-ci.yml` already includes Terraform deployment stages that:
- Validate Terraform syntax
- Plan infrastructure changes
- Apply changes on merge to main branch
- Gate deployments through manual approval

### 4. Monitoring with Prometheus & Grafana

**Prometheus Configuration (`config/monitoring/`):**

1. Deploy Prometheus:
```bash
# Create monitoring namespace
kubectl create namespace monitoring

# Apply Prometheus configuration
kubectl create configmap prometheus-config \
  --from-file=config/monitoring/prometheus.yml \
  -n monitoring

kubectl create configmap prometheus-rules \
  --from-file=config/monitoring/alert-rules.yml \
  -n monitoring
```

2. Access Grafana:
- URL: https://grafana.sxc.codes
- Import dashboard: `tools/monitoring/grafana-dashboards.json`

**Key Metrics Monitored:**
- Application health and performance
- Infrastructure resource usage
- Database connections and query performance
- Kubernetes cluster health
- Custom business metrics

### 5. ELK Stack Logging (`config/logging/`)

**Deploy ELK Stack:**
```bash
# Install Elastic Cloud on Kubernetes (ECK) operator
kubectl create -f https://download.elastic.co/downloads/eck/2.0.0/crds.yaml
kubectl apply -f https://download.elastic.co/downloads/eck/2.0.0/operator.yaml

# Deploy ELK stack for ChaseWhiteRabbit
kubectl apply -f config/logging/elk-stack.yaml

# Verify deployment
kubectl get elasticsearch,kibana,logstash -n chasewhiterabbit
```

**Access Kibana:**
- URL: https://elastic.sxc.codes
- Username: `elastic`
- Password: Retrieved via `kubectl get secret chasewhiterabbit-es-elastic-user -o=jsonpath='{.data.elastic}' | base64 --decode`

### 6. Disaster Recovery (`docs/deployment/disaster-recovery/`)

**Backup Automation:**
```bash
# Make backup script executable
chmod +x docs/deployment/disaster-recovery/backup-automation.sh

# Schedule daily backups via cron
echo "0 2 * * * /path/to/backup-automation.sh" | crontab -
```

**Site Failover Setup:**
1. Review failover procedures: `docs/deployment/disaster-recovery/site-failover.md`
2. Configure secondary site infrastructure
3. Set up database replication
4. Test failover procedures quarterly

## Deployment Process

### Stage 1: Infrastructure Provisioning
1. Deploy Terraform infrastructure
2. Verify network connectivity and security groups
3. Confirm DNS configuration

### Stage 2: Application Deployment
1. Deploy Kubernetes manifests or Helm charts
2. Verify pod health and readiness
3. Test ingress and load balancer configuration

### Stage 3: Monitoring & Logging Setup
1. Deploy Prometheus and Grafana
2. Configure ELK stack
3. Import dashboards and alert rules
4. Test alert notifications

### Stage 4: Disaster Recovery
1. Configure backup automation
2. Test backup and restore procedures
3. Document site failover procedures
4. Schedule disaster recovery drills

## GitLab CI/CD Pipeline Integration

The deployment process is automated through GitLab CI/CD pipelines defined in `.gitlab-ci.yml`:

**Pipeline Stages:**
1. **Build**: Container image building
2. **Test**: Unit and integration tests
3. **Security**: Security scanning and compliance checks
4. **Deploy**: Automated deployment to staging/production
5. **Monitor**: Post-deployment verification and monitoring

**Manual Gates:**
- Production deployments require manual approval
- Infrastructure changes require team review
- Database migrations require DBA approval

## Security Considerations

### SSL/TLS Encryption
- All traffic encrypted with Let's Encrypt certificates
- Certificate auto-renewal configured
- HTTPS enforcement at ingress level

### Network Security
- VPC isolation for all components
- Firewall rules restrict access to necessary ports only
- Private networking between services

### Secrets Management
- Kubernetes secrets for sensitive data
- Encrypted at rest and in transit
- Regular secret rotation procedures

### Access Controls
- RBAC configured for Kubernetes access
- Multi-factor authentication required
- Audit logging enabled

## Monitoring and Alerting

### Alert Recipients
All alerts are sent to:
- tiatheone@protonmail.com
- garrett@sxc.codes
- garrett.dillman@gmail.com

### Critical Alerts
- Service downtime > 2 minutes
- High error rate (>5%)
- Database connection issues
- Infrastructure resource exhaustion

### Performance Monitoring
- Response time percentiles (50th, 95th, 99th)
- Throughput and request rates
- Resource utilization trends
- Business metric tracking

## Troubleshooting

### Common Issues

**Pods not starting:**
```bash
kubectl describe pod <pod-name> -n chasewhiterabbit
kubectl logs <pod-name> -n chasewhiterabbit
```

**Ingress issues:**
```bash
kubectl get ingress -n chasewhiterabbit
kubectl describe ingress chasewhiterabbit-ingress -n chasewhiterabbit
```

**Database connectivity:**
```bash
kubectl exec -it deployment/chasewhiterabbit -n chasewhiterabbit -- \
  psql -h supabase.sxc.codes -U <username> -d chasewhiterabbit
```

### Support Contacts
- **Primary**: tiatheone@protonmail.com
- **Secondary**: garrett@sxc.codes
- **Infrastructure**: gitlab.sxc.codes (issues)

## Maintenance

### Regular Tasks
- **Daily**: Monitor dashboard review
- **Weekly**: Security update review
- **Monthly**: Performance optimization review
- **Quarterly**: Disaster recovery drill

### Upgrade Procedures
1. Test upgrades in staging environment
2. Schedule maintenance window
3. Perform rolling updates where possible
4. Monitor post-upgrade metrics

---

This Advanced DevOps Infrastructure provides enterprise-grade scalability, reliability, and observability for the ChaseWhiteRabbit application. Regular reviews and updates ensure the infrastructure evolves with business requirements and best practices.
