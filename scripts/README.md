# Scripts Directory

This directory contains automation scripts for CI/CD, deployment, and maintenance tasks.

## Structure

- `ci-cd/` - Continuous Integration and Deployment scripts
- `deployment/` - Deployment automation scripts
- `maintenance/` - System maintenance and housekeeping scripts

## Script Standards

- Make all scripts executable and idempotent
- Include proper error handling and logging
- Use meaningful exit codes
- Provide help documentation for each script
- Follow shell scripting best practices

## Usage Guidelines

- All scripts should be runnable from the project root
- Include environment validation before execution
- Log all important operations
- Implement rollback procedures where applicable

## CI/CD Integration

These scripts are designed to work with:
- GitHub Actions (`.github/workflows/`)
- GitLab CI/CD
- Self-hosted runners on docker.sxc.codes and related infrastructure
