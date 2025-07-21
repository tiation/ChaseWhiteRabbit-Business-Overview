# Repository Structure

This repository follows enterprise-grade DevOps best practices with a clean, organized structure for maintainability and scalability.

## Directory Overview

```
├── docs/                     # Documentation
│   ├── architecture/        # System design and architecture docs
│   ├── api/                 # API documentation and schemas
│   ├── user-guides/         # End-user documentation
│   └── deployment/          # Deployment and operational guides
├── config/                   # Configuration management
│   ├── environments/        # Environment-specific configs
│   ├── secrets/             # Secret management templates
│   └── monitoring/          # Monitoring configurations
├── src/                      # Source code
│   ├── app/                 # Application entry points
│   ├── components/          # Reusable components
│   ├── services/            # Business logic and services
│   ├── utils/               # Utility functions
│   └── types/               # Type definitions
├── tests/                    # Testing suite
│   ├── unit/                # Unit tests
│   ├── integration/         # Integration tests
│   ├── e2e/                 # End-to-end tests
│   └── performance/         # Performance tests
├── deploy/                   # Deployment configurations
│   ├── kubernetes/          # K8s manifests (namespaces, deployments, services, ingress)
│   ├── helm-charts/         # Helm charts (templates, values)
│   ├── docker/              # Docker configurations (base, dev, prod)
│   ├── terraform/           # Infrastructure as Code (modules, environments)
│   └── ansible/             # Configuration management (playbooks, roles, inventories)
├── scripts/                  # Automation scripts
│   ├── ci-cd/               # CI/CD automation
│   ├── deployment/          # Deployment scripts
│   └── maintenance/         # Maintenance scripts
├── .github/workflows/        # GitHub Actions workflows
├── assets/                   # Static assets
│   ├── images/              # Image assets
│   ├── fonts/               # Font files
│   └── styles/              # Stylesheets
└── tools/                    # Development tools
    ├── local-dev/           # Local development tools
    ├── monitoring/          # Monitoring tools
    └── security/            # Security tools and configs
```

## Enterprise Standards

This structure supports:

- **Infrastructure as Code**: Terraform modules and Ansible playbooks
- **Container Orchestration**: Kubernetes manifests and Helm charts
- **CI/CD Integration**: GitHub Actions and GitLab CI compatibility
- **Multi-environment Support**: Separate configs for dev, staging, production
- **Security Best Practices**: Proper secrets management and security tooling
- **Monitoring & Observability**: Integrated monitoring configurations
- **Documentation Standards**: Comprehensive documentation structure
- **Testing Strategy**: Multi-layered testing approach

## Integration with VPS Infrastructure

Designed to work with the available VPS infrastructure:
- **docker.sxc.codes** (145.223.22.7) - Primary CI/CD runner and container builds
- **helm.sxc.codes** (145.223.21.248) - Helm chart hosting and K8s deployments
- **gitlab.sxc.codes** (145.223.22.10) - Git-based CI/CD orchestration
- **grafana.sxc.codes** (153.92.214.1) - Monitoring and observability
- **elastic.sxc.codes** (145.223.22.14) - Log aggregation and indexing

## Getting Started

1. Review the README.md files in each major directory
2. Configure environment-specific settings in `config/environments/`
3. Set up CI/CD pipelines using scripts in `scripts/ci-cd/`
4. Deploy using the appropriate method in `deploy/`
