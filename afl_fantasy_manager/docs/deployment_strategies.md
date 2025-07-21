# AFL Fantasy Manager - Deployment Strategies

This document outlines various deployment approaches for the AFL Fantasy Manager application, emphasizing enterprise-grade practices, ethical development, and DevOps best practices with edgy design considerations.

## Table of Contents

1. [Overview](#overview)
2. [Infrastructure Architecture](#infrastructure-architecture)
3. [Containerization Strategy](#containerization-strategy)
4. [Kubernetes Deployment](#kubernetes-deployment)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Environment-Specific Deployments](#environment-specific-deployments)
7. [Monitoring  Observability](#monitoring--observability)
8. [Security  Compliance](#security--compliance)
9. [Backup  Disaster Recovery](#backup--disaster-recovery)
10. [Scaling Strategies](#scaling-strategies)

## Overview

The AFL Fantasy Manager deployment strategy leverages a multi-tier architecture with containerized microservices, orchestrated through Kubernetes, and managed via GitLab CI/CD pipelines across your existing VPS infrastructure.

### Deployment Principles
- **Enterprise-grade**: Scalable, secure, and maintainable
- **Ethical**: Privacy-focused, transparent data handling
- **DevOps-first**: Infrastructure as Code, automated deployments
- **Edgy design**: Modern, responsive, performance-optimized

## Infrastructure Architecture

### Current VPS Infrastructure Utilization

```yaml
# Production Cluster Configuration
production:
  primary_node: "docker.sxc.codes" # 145.223.22.7
  secondary_node: "docker.tiation.net" # 145.223.22.9
  helm_repository: "helm.sxc.codes" # 145.223.21.248
  ci_cd_orchestrator: "gitlab.sxc.codes" # 145.223.22.10
  monitoring: "grafana.sxc.codes" # 153.92.214.1
  logging: "elastic.sxc.codes" # 145.223.22.14
  database: "supabase.sxc.codes" # 93.127.167.157
  utility_node: "ubuntu.sxc.codes" # 89.116.191.60
```

### Network Architecture

```mermaid
graph TB
    A[Load Balancer/Nginx] -- B[Kubernetes Cluster]
    B -- C[AFL Fantasy Frontend]
    B -- D[AFL Fantasy API]
    B -- E[Data Processing Service]
    B -- F[Notification Service]
    
    D -- G[Supabase Database]
    E -- G
    F -- G
    
    H[GitLab CI/CD] -- B
    I[Grafana Monitoring] -- B
    J[ELK Stack] -- B
```

## Containerization Strategy

### Docker Configuration

#### Frontend Container (React/Next.js)
```dockerfile
# client/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Backend Container (Node.js/Python)
```dockerfile
# server/Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
USER node
CMD ["npm", "start"]
```

#### Data Processing Container
```dockerfile
# data-processor/Dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Docker Compose for Local Development

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  frontend:
    build:
      context: ./client
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - ./client:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - REACT_APP_API_URL=http://localhost:4000

  backend:
    build:
      context: ./server
      dockerfile: Dockerfile.dev
    ports:
      - "4000:4000"
    volumes:
      - ./server:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://user:password@db:5432/afl_fantasy
    depends_on:
      - db

  data-processor:
    build:
      context: ./data-processor
    ports:
      - "8000:8000"
    volumes:
      - ./data-processor:/app
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/afl_fantasy
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=afl_fantasy
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

## Kubernetes Deployment

### Namespace Configuration

```yaml
# k8s/namespace.yml
apiVersion: v1
kind: Namespace
metadata:
  name: afl-fantasy-manager
  labels:
    environment: production
    project: afl-fantasy-manager
```

### Frontend Deployment

```yaml
# k8s/frontend-deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: afl-fantasy-frontend
  namespace: afl-fantasy-manager
  labels:
    app: afl-fantasy-frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: afl-fantasy-frontend
  template:
    metadata:
      labels:
        app: afl-fantasy-frontend
    spec:
      containers:
      - name: frontend
        image: docker.sxc.codes/afl-fantasy-frontend:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        env:
        - name: REACT_APP_API_URL
          valueFrom:
            configMapKeyRef:
              name: afl-fantasy-config
              key: api-url
---
apiVersion: v1
kind: Service
metadata:
  name: afl-fantasy-frontend-service
  namespace: afl-fantasy-manager
spec:
  selector:
    app: afl-fantasy-frontend
  ports:
  - port: 80
    targetPort: 80
  type: ClusterIP
```

### Backend Deployment

```yaml
# k8s/backend-deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: afl-fantasy-backend
  namespace: afl-fantasy-manager
spec:
  replicas: 2
  selector:
    matchLabels:
      app: afl-fantasy-backend
  template:
    metadata:
      labels:
        app: afl-fantasy-backend
    spec:
      containers:
      - name: backend
        image: docker.sxc.codes/afl-fantasy-backend:latest
        ports:
        - containerPort: 4000
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: afl-fantasy-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            configMapKeyRef:
              name: afl-fantasy-config
              key: redis-url
        livenessProbe:
          httpGet:
            path: /health
            port: 4000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 4000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: afl-fantasy-backend-service
  namespace: afl-fantasy-manager
spec:
  selector:
    app: afl-fantasy-backend
  ports:
  - port: 4000
    targetPort: 4000
  type: ClusterIP
```

### Ingress Configuration

```yaml
# k8s/ingress.yml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: afl-fantasy-ingress
  namespace: afl-fantasy-manager
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
spec:
  tls:
  - hosts:
    - afl-fantasy.sxc.codes
    secretName: afl-fantasy-tls
  rules:
  - host: afl-fantasy.sxc.codes
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: afl-fantasy-backend-service
            port:
              number: 4000
      - path: /
        pathType: Prefix
        backend:
          service:
            name: afl-fantasy-frontend-service
            port:
              number: 80
```

### Helm Chart Structure

```yaml
# helm/afl-fantasy-manager/Chart.yaml
apiVersion: v2
name: afl-fantasy-manager
description: AFL Fantasy Manager Helm Chart
version: 1.0.0
appVersion: "1.0.0"
```

```yaml
# helm/afl-fantasy-manager/values.yaml
replicaCount:
  frontend: 3
  backend: 2

image:
  repository: docker.sxc.codes
  pullPolicy: Always
  tag: "latest"

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: afl-fantasy.sxc.codes
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: afl-fantasy-tls
      hosts:
        - afl-fantasy.sxc.codes

resources:
  frontend:
    requests:
      memory: 128Mi
      cpu: 100m
    limits:
      memory: 256Mi
      cpu: 200m
  backend:
    requests:
      memory: 256Mi
      cpu: 200m
    limits:
      memory: 512Mi
      cpu: 500m

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80

postgresql:
  enabled: false
  external:
    host: supabase.sxc.codes
    database: afl_fantasy
```

## CI/CD Pipeline

### GitLab CI Configuration

```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy-staging
  - deploy-production

variables:
  DOCKER_REGISTRY: docker.sxc.codes
  DOCKER_TLS_CERTDIR: "/certs"
  HELM_CHART_REPO: https://helm.sxc.codes
  KUBECONFIG: /root/.kube/config

before_script:
  - echo $CI_REGISTRY_PASSWORD | docker login -u $CI_REGISTRY_USER --password-stdin $DOCKER_REGISTRY

# Test Stage
test:frontend:
  stage: test
  image: node:18-alpine
  script:
    - cd client
    - npm ci
    - npm run test:coverage
    - npm run lint
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: client/coverage/cobertura-coverage.xml
  coverage: '/Statements.*?(\d+(?:\.\d+)?)%/'

test:backend:
  stage: test
  image: node:18-alpine
  services:
    - postgres:15-alpine
  variables:
    POSTGRES_DB: test_db
    POSTGRES_USER: test_user
    POSTGRES_PASSWORD: test_password
    DATABASE_URL: postgresql://test_user:test_password@postgres:5432/test_db
  script:
    - cd server
    - npm ci
    - npm run test:coverage
    - npm run lint
  artifacts:
    reports:
      junit: server/test-results.xml
      coverage_report:
        coverage_format: cobertura
        path: server/coverage/cobertura-coverage.xml

test:data-processor:
  stage: test
  image: python:3.11-slim
  script:
    - cd data-processor
    - pip install -r requirements.txt
    - pip install pytest pytest-cov
    - pytest --cov=. --cov-report=xml
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: data-processor/coverage.xml

# Build Stage
build:frontend:
  stage: build
  image: docker:24.0.5
  services:
    - docker:24.0.5-dind
  script:
    - cd client
    - docker build -t $DOCKER_REGISTRY/afl-fantasy-frontend:$CI_COMMIT_SHA .
    - docker tag $DOCKER_REGISTRY/afl-fantasy-frontend:$CI_COMMIT_SHA $DOCKER_REGISTRY/afl-fantasy-frontend:latest
    - docker push $DOCKER_REGISTRY/afl-fantasy-frontend:$CI_COMMIT_SHA
    - docker push $DOCKER_REGISTRY/afl-fantasy-frontend:latest
  only:
    - main
    - develop

build:backend:
  stage: build
  image: docker:24.0.5
  services:
    - docker:24.0.5-dind
  script:
    - cd server
    - docker build -t $DOCKER_REGISTRY/afl-fantasy-backend:$CI_COMMIT_SHA .
    - docker tag $DOCKER_REGISTRY/afl-fantasy-backend:$CI_COMMIT_SHA $DOCKER_REGISTRY/afl-fantasy-backend:latest
    - docker push $DOCKER_REGISTRY/afl-fantasy-backend:$CI_COMMIT_SHA
    - docker push $DOCKER_REGISTRY/afl-fantasy-backend:latest
  only:
    - main
    - develop

build:data-processor:
  stage: build
  image: docker:24.0.5
  services:
    - docker:24.0.5-dind
  script:
    - cd data-processor
    - docker build -t $DOCKER_REGISTRY/afl-fantasy-data-processor:$CI_COMMIT_SHA .
    - docker tag $DOCKER_REGISTRY/afl-fantasy-data-processor:$CI_COMMIT_SHA $DOCKER_REGISTRY/afl-fantasy-data-processor:latest
    - docker push $DOCKER_REGISTRY/afl-fantasy-data-processor:$CI_COMMIT_SHA
    - docker push $DOCKER_REGISTRY/afl-fantasy-data-processor:latest
  only:
    - main
    - develop

# Staging Deployment
deploy:staging:
  stage: deploy-staging
  image: alpine/helm:3.12.0
  before_script:
    - apk add --no-cache curl
    - curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
    - chmod +x kubectl  mv kubectl /usr/local/bin/
    - echo "$KUBE_CONFIG" | base64 -d  $KUBECONFIG
  script:
    - helm repo add afl-fantasy $HELM_CHART_REPO
    - helm repo update
    - |
      helm upgrade --install afl-fantasy-staging ./helm/afl-fantasy-manager \
        --namespace afl-fantasy-staging \
        --create-namespace \
        --set image.tag=$CI_COMMIT_SHA \
        --set ingress.hosts[0].host=staging.afl-fantasy.sxc.codes \
        --set ingress.tls[0].hosts[0]=staging.afl-fantasy.sxc.codes \
        --values helm/afl-fantasy-manager/values-staging.yaml
  environment:
    name: staging
    url: https://staging.afl-fantasy.sxc.codes
  only:
    - develop

# Production Deployment
deploy:production:
  stage: deploy-production
  image: alpine/helm:3.12.0
  before_script:
    - apk add --no-cache curl
    - curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
    - chmod +x kubectl  mv kubectl /usr/local/bin/
    - echo "$KUBE_CONFIG" | base64 -d  $KUBECONFIG
  script:
    - helm repo add afl-fantasy $HELM_CHART_REPO
    - helm repo update
    - |
      helm upgrade --install afl-fantasy-production ./helm/afl-fantasy-manager \
        --namespace afl-fantasy-production \
        --create-namespace \
        --set image.tag=$CI_COMMIT_SHA \
        --set ingress.hosts[0].host=afl-fantasy.sxc.codes \
        --set ingress.tls[0].hosts[0]=afl-fantasy.sxc.codes \
        --values helm/afl-fantasy-manager/values-production.yaml
  environment:
    name: production
    url: https://afl-fantasy.sxc.codes
  when: manual
  only:
    - main
```

### Environment-Specific Values

```yaml
# helm/afl-fantasy-manager/values-staging.yaml
replicaCount:
  frontend: 1
  backend: 1

resources:
  frontend:
    requests:
      memory: 64Mi
      cpu: 50m
    limits:
      memory: 128Mi
      cpu: 100m
  backend:
    requests:
      memory: 128Mi
      cpu: 100m
    limits:
      memory: 256Mi
      cpu: 200m

postgresql:
  external:
    host: staging-db.supabase.sxc.codes
    database: afl_fantasy_staging
```

```yaml
# helm/afl-fantasy-manager/values-production.yaml
replicaCount:
  frontend: 3
  backend: 2

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10

postgresql:
  external:
    host: supabase.sxc.codes
    database: afl_fantasy_production

monitoring:
  enabled: true
  serviceMonitor:
    enabled: true
    labels:
      release: prometheus
```

## Environment-Specific Deployments

### Development Environment

```bash
# Local development with Docker Compose
docker-compose -f docker-compose.dev.yml up -d

# Or using npm/yarn for faster development
cd client  npm start 
cd server  npm run dev 
cd data-processor  uvicorn main:app --reload
```

### Staging Environment (docker.tiation.net)

```bash
# Deploy to staging server
ssh root@docker.tiation.net

# Pull latest images
docker pull docker.sxc.codes/afl-fantasy-frontend:develop
docker pull docker.sxc.codes/afl-fantasy-backend:develop

# Deploy with Docker Compose
docker-compose -f docker-compose.staging.yml up -d
```

### Production Environment (docker.sxc.codes)

```bash
# Kubernetes deployment
kubectl apply -f k8s/namespace.yml
kubectl apply -f k8s/configmap.yml
kubectl apply -f k8s/secrets.yml
kubectl apply -f k8s/

# Or using Helm
helm install afl-fantasy-production ./helm/afl-fantasy-manager \
  --namespace afl-fantasy-production \
  --create-namespace \
  --values helm/afl-fantasy-manager/values-production.yaml
```

## Monitoring  Observability

### Prometheus Configuration

```yaml
# monitoring/prometheus-config.yml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s
    
    rule_files:
      - "afl_fantasy_rules.yml"
    
    scrape_configs:
      - job_name: 'afl-fantasy-frontend'
        kubernetes_sd_configs:
          - role: endpoints
            namespaces:
              names:
                - afl-fantasy-manager
        relabel_configs:
          - source_labels: [__meta_kubernetes_service_name]
            action: keep
            regex: afl-fantasy-frontend-service
      
      - job_name: 'afl-fantasy-backend'
        kubernetes_sd_configs:
          - role: endpoints
            namespaces:
              names:
                - afl-fantasy-manager
        relabel_configs:
          - source_labels: [__meta_kubernetes_service_name]
            action: keep
            regex: afl-fantasy-backend-service
    
    alerting:
      alertmanagers:
        - static_configs:
            - targets:
              - alertmanager:9093
```

### Grafana Dashboard Configuration

```json
{
  "dashboard": {
    "title": "AFL Fantasy Manager - Overview",
    "tags": ["afl-fantasy", "production"],
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{job=\"afl-fantasy-backend\"}[5m])",
            "legendFormat": "{{method}} {{status}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job=\"afl-fantasy-backend\"}[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "singlestat",
        "targets": [
          {
            "expr": "rate(http_requests_total{job=\"afl-fantasy-backend\",status=~\"5..\"}[5m]) / rate(http_requests_total{job=\"afl-fantasy-backend\"}[5m]) * 100",
            "legendFormat": "Error Rate %"
          }
        ]
      }
    ]
  }
}
```

### Alert Rules

```yaml
# monitoring/alert-rules.yml
groups:
  - name: afl-fantasy-alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m])  0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} for {{ $labels.instance }}"
      
      - alert: HighMemoryUsage
        expr: container_memory_usage_bytes / container_spec_memory_limit_bytes  0.9
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is {{ $value | humanizePercentage }} for {{ $labels.pod }}"
      
      - alert: PodCrashLooping
        expr: rate(kube_pod_container_status_restarts_total[5m])  0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Pod is crash looping"
          description: "Pod {{ $labels.pod }} in namespace {{ $labels.namespace }} is crash looping"
```

### Alertmanager Configuration

```yaml
# monitoring/alertmanager-config.yml
global:
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alerts@sxc.codes'
  smtp_auth_username: 'alerts@sxc.codes'
  smtp_auth_password: '{{SMTP_PASSWORD}}'

route:
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'

receivers:
  - name: 'web.hook'
    email_configs:
      - to: 'tiatheone@protonmail.com'
        subject: 'AFL Fantasy Manager Alert - {{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
        body: |
          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          Severity: {{ .Labels.severity }}
          Instance: {{ .Labels.instance }}
          {{ end }}
      - to: 'garrett@sxc.codes'
        subject: 'AFL Fantasy Manager Alert - {{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
        body: |
          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          Severity: {{ .Labels.severity }}
          Instance: {{ .Labels.instance }}
          {{ end }}
      - to: 'garrett.dillman@gmail.com'
        subject: 'AFL Fantasy Manager Alert - {{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
        body: |
          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          Severity: {{ .Labels.severity }}
          Instance: {{ .Labels.instance }}
          {{ end }}
```

## Security  Compliance

### Network Policies

```yaml
# k8s/network-policies.yml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: afl-fantasy-network-policy
  namespace: afl-fantasy-manager
spec:
  podSelector:
    matchLabels:
      app: afl-fantasy-backend
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: afl-fantasy-frontend
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 4000
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: kube-system
    ports:
    - protocol: TCP
      port: 53
    - protocol: UDP
      port: 53
  - to: []
    ports:
    - protocol: TCP
      port: 5432  # Database access
    - protocol: TCP
      port: 6379  # Redis access
```

### Pod Security Standards

```yaml
# k8s/pod-security-policy.yml
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: afl-fantasy-psp
spec:
  privileged: false
  allowPrivilegeEscalation: false
  requiredDropCapabilities:
    - ALL
  volumes:
    - 'configMap'
    - 'emptyDir'
    - 'projected'
    - 'secret'
    - 'downwardAPI'
    - 'persistentVolumeClaim'
  runAsUser:
    rule: 'MustRunAsNonRoot'
  seLinux:
    rule: 'RunAsAny'
  fsGroup:
    rule: 'RunAsAny'
```

### RBAC Configuration

```yaml
# k8s/rbac.yml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: afl-fantasy-service-account
  namespace: afl-fantasy-manager
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: afl-fantasy-manager
  name: afl-fantasy-role
rules:
- apiGroups: [""]
  resources: ["pods", "services", "configmaps", "secrets"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["apps"]
  resources: ["deployments", "replicasets"]
  verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: afl-fantasy-role-binding
  namespace: afl-fantasy-manager
subjects:
- kind: ServiceAccount
  name: afl-fantasy-service-account
  namespace: afl-fantasy-manager
roleRef:
  kind: Role
  name: afl-fantasy-role
  apiGroup: rbac.authorization.k8s.io
```

## Backup  Disaster Recovery

### Database Backup Strategy

```bash
#!/bin/bash
# scripts/backup-database.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/afl-fantasy"
DB_HOST="supabase.sxc.codes"
DB_NAME="afl_fantasy_production"
BACKUP_FILE="${BACKUP_DIR}/afl_fantasy_backup_${TIMESTAMP}.sql"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create database backup
PGPASSWORD=$DB_PASSWORD pg_dump \
  -h $DB_HOST \
  -U $DB_USER \
  -d $DB_NAME \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists  $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Upload to remote storage (S3-compatible)
aws s3 cp ${BACKUP_FILE}.gz s3://afl-fantasy-backups/database/ \
  --endpoint-url https://s3.sxc.codes

# Clean up local backups older than 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Database backup completed: ${BACKUP_FILE}.gz"
```

### Application State Backup

```yaml
# k8s/backup-cronjob.yml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: afl-fantasy-backup
  namespace: afl-fantasy-manager
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: postgres:15-alpine
            command:
            - /bin/bash
            - -c
            - |
              TIMESTAMP=$(date +%Y%m%d_%H%M%S)
              BACKUP_FILE="/tmp/afl_fantasy_backup_${TIMESTAMP}.sql"
              
              pg_dump $DATABASE_URL  $BACKUP_FILE
              gzip $BACKUP_FILE
              
              # Upload to backup server
              scp ${BACKUP_FILE}.gz root@ubuntu.sxc.codes:/backups/afl-fantasy/
              
              echo "Backup completed: ${BACKUP_FILE}.gz"
            env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: afl-fantasy-secrets
                  key: database-url
          restartPolicy: OnFailure
```

### Disaster Recovery Plan

```bash
#!/bin/bash
# scripts/disaster-recovery.sh

echo "AFL Fantasy Manager - Disaster Recovery"
echo "========================================"

# 1. Restore Database
echo "Restoring database from backup..."
LATEST_BACKUP=$(aws s3 ls s3://afl-fantasy-backups/database/ | sort | tail -n 1 | awk '{print $4}')
aws s3 cp s3://afl-fantasy-backups/database/$LATEST_BACKUP /tmp/

gunzip /tmp/$LATEST_BACKUP
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME  /tmp/${LATEST_BACKUP%.gz}

# 2. Redeploy Application
echo "Redeploying application..."
helm upgrade --install afl-fantasy-production ./helm/afl-fantasy-manager \
  --namespace afl-fantasy-production \
  --create-namespace \
  --values helm/afl-fantasy-manager/values-production.yaml

# 3. Verify Deployment
echo "Verifying deployment..."
kubectl rollout status deployment/afl-fantasy-frontend -n afl-fantasy-manager
kubectl rollout status deployment/afl-fantasy-backend -n afl-fantasy-manager

# 4. Run Health Checks
echo "Running health checks..."
curl -f https://afl-fantasy.sxc.codes/health || exit 1
curl -f https://afl-fantasy.sxc.codes/api/health || exit 1

echo "Disaster recovery completed successfully!"
```

## Scaling Strategies

### Horizontal Pod Autoscaler

```yaml
# k8s/hpa.yml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: afl-fantasy-frontend-hpa
  namespace: afl-fantasy-manager
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: afl-fantasy-frontend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 300
      policies:
      - type: Pods
        value: 2
        periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Pods
        value: 1
        periodSeconds: 60
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: afl-fantasy-backend-hpa
  namespace: afl-fantasy-manager
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: afl-fantasy-backend
  minReplicas: 2
  maxReplicas: 8
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Vertical Pod Autoscaler

```yaml
# k8s/vpa.yml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: afl-fantasy-backend-vpa
  namespace: afl-fantasy-manager
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: afl-fantasy-backend
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
    - containerName: backend
      maxAllowed:
        cpu: 1
        memory: 2Gi
      minAllowed:
        cpu: 100m
        memory: 128Mi
```

### Load Testing Configuration

```yaml
# k6-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '5m', target: 100 }, // Ramp up
    { duration: '10m', target: 100 }, // Stay at 100 users
    { duration: '5m', target: 200 }, // Ramp to 200 users
    { duration: '10m', target: 200 }, // Stay at 200 users
    { duration: '5m', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95) 2000'], // 95% of requests must complete below 2s
    http_req_failed: ['rate 0.05'], // Error rate must be below 5%
  },
};

export default function() {
  // Test homepage
  let response = http.get('https://afl-fantasy.sxc.codes/');
  check(response, {
    'Homepage loads': (r)  r.status === 200,
    'Homepage loads in  2s': (r)  r.timings.duration  2000,
  });

  sleep(1);

  // Test API endpoint
  response = http.get('https://afl-fantasy.sxc.codes/api/health');
  check(response, {
    'API health check passes': (r)  r.status === 200,
    'API responds in  1s': (r)  r.timings.duration  1000,
  });

  sleep(2);
}
```

## Deployment Checklist

### Pre-Deployment
- [ ] Code review completed and approved
- [ ] All tests passing (unit, integration, e2e)
- [ ] Security scan completed
- [ ] Performance testing completed
- [ ] Database migrations ready
- [ ] Configuration updated
- [ ] Backup completed

### Deployment Process
- [ ] Deploy to staging environment
- [ ] Smoke tests pass on staging
- [ ] Load tests pass on staging
- [ ] Security tests pass on staging
- [ ] Deploy to production
- [ ] Health checks pass
- [ ] Monitor for 15 minutes post-deployment

### Post-Deployment
- [ ] Application accessible
- [ ] All features working
- [ ] Performance metrics normal
- [ ] Error rates within acceptable limits
- [ ] Alerts configured and working
- [ ] Documentation updated
- [ ] Team notified

## Troubleshooting

### Common Issues

#### Pod Won't Start
```bash
# Check pod status
kubectl get pods -n afl-fantasy-manager

# Check pod logs
kubectl logs pod-name -n afl-fantasy-manager

# Describe pod for events
kubectl describe pod pod-name -n afl-fantasy-manager
```

#### High Memory Usage
```bash
# Check resource usage
kubectl top pods -n afl-fantasy-manager

# Check HPA status
kubectl get hpa -n afl-fantasy-manager

# Scale manually if needed
kubectl scale deployment afl-fantasy-backend --replicas=4 -n afl-fantasy-manager
```

#### Database Connection Issues
```bash
# Test database connection
kubectl run -it --rm debug --image=postgres:15-alpine --restart=Never -- \
  psql -h supabase.sxc.codes -U $DB_USER -d afl_fantasy_production -c "SELECT 1;"

# Check database secrets
kubectl get secret afl-fantasy-secrets -n afl-fantasy-manager -o yaml
```

### Emergency Procedures

#### Rollback Deployment
```bash
# Rollback using Helm
helm rollback afl-fantasy-production -n afl-fantasy-manager

# Or rollback specific deployment
kubectl rollout undo deployment/afl-fantasy-backend -n afl-fantasy-manager
```

#### Scale Down for Maintenance
```bash
# Scale to zero replicas
kubectl scale deployment afl-fantasy-frontend --replicas=0 -n afl-fantasy-manager
kubectl scale deployment afl-fantasy-backend --replicas=0 -n afl-fantasy-manager

# Maintenance mode page
kubectl apply -f k8s/maintenance-mode.yml
```

## Conclusion

This deployment strategy provides a comprehensive, enterprise-grade approach to deploying the AFL Fantasy Manager application. It leverages your existing VPS infrastructure, implements DevOps best practices, ensures ethical data handling, and maintains an edgy, modern design approach.

The strategy is designed to be scalable, secure, and maintainable, with proper monitoring, alerting, and disaster recovery procedures in place. Regular reviews and updates of this deployment strategy should be conducted to ensure it continues to meet the evolving needs of the application and infrastructure.
