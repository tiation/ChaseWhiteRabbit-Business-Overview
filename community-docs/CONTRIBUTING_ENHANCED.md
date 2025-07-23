# Contributing to ChaseWhiteRabbit 🐰

## Welcome Contributors!

Thank you for your interest in contributing to ChaseWhiteRabbit! This project embodies enterprise-grade development practices while maintaining the spirit of community collaboration that makes open source special.

## 🎯 Our Philosophy

**Respectful Innovation**: We modernize legacy systems without disrupting their essence. Every contribution should honor the original creator's vision while advancing enterprise-grade practices aligned with **ChaseWhiteRabbit NGO's** mission to provide high-value tools for WA's construction, mining, and resources sector while keeping overheads low.

## 🚀 Getting Started

### Prerequisites
- **Git**: Configured with SSH (preferred by project maintainers)
- **Docker**: Version 24.0+ with Docker Compose
- **Node.js**: Version 18+ (if contributing to web applications)
- **Basic understanding**: DevOps practices, containerization, and enterprise development standards

### Local Setup Steps

#### 1. Repository Setup
```bash
# Clone using SSH (preferred)
git clone git@github.com:tiation/ChaseWhiteRabbit-Business-Overview.git
cd ChaseWhiteRabbit-Business-Overview

# Verify remote configuration
git remote -v
```

#### 2. Development Environment Configuration
```bash
# Install development dependencies
npm install

# Set up pre-commit hooks for code quality
pip install pre-commit
pre-commit install

# Install additional tools
npm install -g @commitlint/cli @commitlint/config-conventional
```

#### 3. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Configure local environment variables
# Edit .env file with your local settings
```

#### 4. Docker Environment Setup
```bash
# Build development containers
docker-compose -f docker-compose.dev.yml build

# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# Verify containers are running
docker-compose ps
```

#### 5. Verify Installation
```bash
# Run tests to ensure everything works
npm test

# Check code quality
npm run lint

# Verify security scanning works
npm run security

# Test development server
npm run dev
```

## 🌲 Branch Naming Conventions

### Naming Pattern
```
<type>/<scope>-<description>
```

### Branch Types
- **feature/**: New features or enhancements
- **bugfix/**: Bug fixes and corrections
- **hotfix/**: Critical production fixes
- **docs/**: Documentation improvements
- **infra/**: Infrastructure and deployment changes
- **refactor/**: Code refactoring without functional changes
- **test/**: Adding or improving tests
- **chore/**: Maintenance tasks (dependencies, build configs)

### Examples
```bash
feature/user-authentication-system
bugfix/dice-roller-calculation-error
hotfix/security-vulnerability-patch
docs/api-endpoint-documentation
infra/kubernetes-helm-charts
refactor/database-connection-pooling
test/integration-test-coverage
chore/dependency-updates
```

### Branch Lifecycle
```bash
# Create and switch to new branch
git checkout -b feature/new-feature-name

# Work on your changes...
git add .
git commit -m "feat(scope): implement new feature"

# Push branch to remote
git push -u origin feature/new-feature-name

# Create Pull Request through GitHub UI
```

## 📝 Commit Message Practices

### Commit Message Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Commit Types
- **feat**: New features
- **fix**: Bug fixes
- **docs**: Documentation changes
- **style**: Code style changes (formatting, whitespace)
- **refactor**: Code refactoring
- **test**: Adding or modifying tests
- **chore**: Maintenance tasks
- **perf**: Performance improvements
- **ci**: CI/CD configuration changes
- **build**: Build system changes

### Scope Examples
- **api**: API-related changes
- **ui**: User interface changes
- **auth**: Authentication/authorization
- **db**: Database changes
- **docker**: Docker/containerization
- **helm**: Kubernetes Helm charts
- **monitoring**: Observability and monitoring
- **security**: Security-related changes

### Subject Guidelines
- Use imperative mood (\"add feature\" not \"added feature\")
- Keep under 50 characters
- No period at the end
- Capitalize first letter

### Body Guidelines
- Wrap at 72 characters
- Explain **what** and **why**, not **how**
- Use bullet points for multiple changes
- Reference issues with `#123`

### Footer Guidelines
- **Breaking Changes**: Start with `BREAKING CHANGE:`
- **Issue References**: `Closes #123`, `Fixes #456`
- **Co-authors**: `Co-authored-by: Name <email>`

### Commit Message Examples

#### Feature Addition
```
feat(auth): implement OAuth2 authentication

- Add OAuth2 provider configuration
- Implement user session management
- Add authentication middleware
- Update API documentation

Closes #145
```

#### Bug Fix
```
fix(dice-roller): correct probability calculation

The dice probability calculation was returning incorrect
values for combinations involving multiple dice types.

Fixed by updating the combinatorial logic in the
calculateProbability function.

Fixes #234
```

#### Breaking Change
```
feat(api): restructure authentication endpoints

BREAKING CHANGE: Authentication endpoints have been moved
from /auth/* to /api/v2/auth/* to align with API versioning
strategy.

Migration guide:
- Update all /auth/login calls to /api/v2/auth/login
- Update all /auth/logout calls to /api/v2/auth/logout

Closes #123
```

#### Infrastructure Change
```
infra(k8s): add horizontal pod autoscaler

- Configure HPA for production deployments
- Set CPU threshold at 70%
- Add Grafana dashboard for scaling metrics
- Update deployment documentation

Closes #167
```

## 🔍 Code Review Guidelines

### For Contributors

#### Before Submitting PR
1. **Self-Review Checklist**
   - [ ] Code follows project coding standards
   - [ ] All tests pass locally
   - [ ] Documentation updated (if applicable)
   - [ ] Commit messages follow convention
   - [ ] No sensitive information exposed
   - [ ] Performance impact considered

2. **PR Description Template**
   ```markdown
   ## Description
   Brief description of changes
   
   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update
   - [ ] Infrastructure change
   
   ## Testing
   - [ ] Unit tests added/updated
   - [ ] Integration tests pass
   - [ ] Manual testing performed
   
   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] Documentation updated
   - [ ] No breaking changes (or clearly documented)
   ```

3. **Testing Requirements**
   ```bash
   # Run full test suite
   npm test
   
   # Run linting
   npm run lint
   
   # Run security checks
   npm run security
   
   # Test Docker build
   docker build -t test-build .
   
   # Integration testing
   docker-compose -f docker-compose.test.yml up --abort-on-container-exit
   ```

### For Reviewers

#### Review Criteria
1. **Code Quality**
   - Follows established patterns
   - Proper error handling
   - Appropriate logging
   - Security considerations

2. **Testing**
   - Adequate test coverage
   - Tests are meaningful
   - Edge cases covered
   - Performance implications tested

3. **Documentation**
   - Code is self-documenting
   - Complex logic explained
   - API changes documented
   - README updated if needed

4. **Enterprise Standards**
   - Observability considerations
   - Scalability implications
   - Security best practices
   - Infrastructure compatibility

#### Review Process
1. **Automated Checks**: Must pass before review
2. **Technical Review**: Focus on code quality and design
3. **Security Review**: For security-sensitive changes
4. **Performance Review**: For performance-critical changes
5. **Final Approval**: From project maintainer

#### Review Feedback Guidelines
- **Be Constructive**: Provide specific, actionable feedback
- **Be Educational**: Explain why changes are needed
- **Be Respectful**: Maintain professional tone
- **Be Timely**: Review within 48 hours when possible

#### Example Review Comments
```markdown
// Good feedback
**Suggestion**: Consider using a connection pool here to improve database performance under load.

**Issue**: This function lacks error handling for network failures. Please add try-catch blocks and appropriate logging.

**Question**: What's the expected behavior when this API receives malformed input?

// Avoid
This is wrong.
Please fix.
I don't like this approach.
```

## 📋 Contribution Types

### 🐛 Bug Reports
**Template for Bug Reports:**
```markdown
**Bug Description**
Clear description of the bug

**Environment**
- OS: [e.g., Ubuntu 22.04]
- Docker version: [e.g., 24.0.6]
- Infrastructure: [e.g., docker.sxc.codes]

**Reproduction Steps**
1. Step one
2. Step two
3. Expected vs actual behavior

**Additional Context**
Logs, screenshots, related issues
```

### 💡 Feature Requests
**Template for Feature Requests:**
```markdown
**Feature Description**
Clear description of the proposed feature

**Business Value**
How this aligns with ChaseWhiteRabbit NGO mission

**Implementation Approach**
Suggested technical approach

**Acceptance Criteria**
- [ ] Criterion 1
- [ ] Criterion 2
```

### 📖 Documentation
- Follow project documentation standards
- Include practical examples
- Update navigation and cross-references
- Test all code examples

### 🔧 Code Contributions
- Follow existing patterns
- Include comprehensive tests
- Add monitoring considerations
- Ensure Docker compatibility

## 🧪 Testing Requirements

### Testing Strategy
1. **Unit Tests**: Core business logic
2. **Integration Tests**: Component interactions
3. **End-to-End Tests**: Full user workflows
4. **Performance Tests**: Load and stress testing
5. **Security Tests**: Vulnerability scanning
6. **Infrastructure Tests**: Deployment validation

### Test Commands
```bash
# Unit tests with coverage
npm test -- --coverage

# Integration tests
npm run test:integration

# End-to-end tests
npm run test:e2e

# Performance tests
npm run test:performance

# Security scanning
npm run test:security

# All tests
npm run test:all
```

### Test Requirements
- **Coverage**: Minimum 80% code coverage
- **Performance**: Sub-100ms response time maintained
- **Security**: No high-severity vulnerabilities
- **Reliability**: Tests must be deterministic

## 🚀 Infrastructure Contributions

### Infrastructure Standards
- **Infrastructure as Code**: All infrastructure defined in code
- **Monitoring**: Comprehensive observability included
- **Security**: Security scanning integrated
- **Scalability**: Auto-scaling considerations

### Testing Infrastructure Changes
```bash
# Test on development infrastructure
ssh root@145.223.22.9 'cd /deployments && ./test-deployment.sh'

# Validate monitoring
curl http://grafana.sxc.codes:3000/api/health

# Check log aggregation
curl http://elastic.sxc.codes:9200/_cluster/health

# Verify CI/CD pipeline
git push origin feature/infrastructure-test
```

### Required Documentation
- Update deployment guides
- Add monitoring dashboards
- Include troubleshooting steps
- Document rollback procedures

## 🌍 Community Standards

### Communication Channels
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Email**: tiatheone@protonmail.com for community questions
- **Enterprise**: garrett@sxc.codes for business inquiries

### Response Times
- **Critical Issues**: 4 hours
- **Bug Reports**: 24 hours
- **Feature Requests**: 48 hours
- **Pull Requests**: 48 hours

### Community Guidelines
- **Professional**: Maintain enterprise-grade communication
- **Inclusive**: Welcome all skill levels and backgrounds
- **Constructive**: Provide actionable feedback
- **Patient**: Foster learning environment

## 🏆 Recognition and Growth

### Contributor Levels
1. **First-time Contributor**: First merged PR
2. **Regular Contributor**: 5+ merged PRs
3. **Core Contributor**: 20+ PRs + mentoring
4. **Maintainer**: Commit access + leadership

### Recognition Programs
- **Contributor Spotlight**: Monthly recognition
- **Enterprise Portfolio**: Showcase contributions
- **Conference Speaking**: Opportunities to present
- **Professional Networks**: Connect with industry leaders

## 📞 Getting Help

### Development Support
- **Documentation**: Comprehensive guides in `/docs`
- **Examples**: Reference implementations in `/examples`
- **Infrastructure Access**: Development environments available
- **Mentorship**: Experienced contributors for guidance

### Troubleshooting Common Issues
```bash
# Docker issues
docker system prune -f
docker-compose down && docker-compose up -d

# Permission issues
sudo chown -R $USER:$USER .
chmod +x scripts/*.sh

# Node.js issues
rm -rf node_modules package-lock.json
npm install

# Git issues
git config --global user.name \"Your Name\"
git config --global user.email \"your.email@example.com\"
```

---

## 🐰 Thank You!

Your contributions make ChaseWhiteRabbit a success! Whether you're fixing documentation typos or architecting major infrastructure improvements, every contribution matters and is appreciated.

*\"In the spirit of the white rabbit, we're always running toward better solutions — thank you for helping us get there!\"*

---

**Ready to contribute? Check out our [Good First Issues](https://github.com/tiation/ChaseWhiteRabbit-Business-Overview/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) to get started!**
