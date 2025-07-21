# ChaseWhiteRabbit API Documentation

**Enterprise Digital Transformation Platform API**

---

## Overview

The ChaseWhiteRabbit API provides comprehensive access to our enterprise digital transformation platform, enabling programmatic management of legacy system modernization projects, deployment automation, and observability integration.

## API Features

- **RESTful Architecture**: Consistent HTTP-based interface with JSON payloads
- **Comprehensive Authentication**: Bearer token (JWT) and API key support
- **Rate Limiting**: Fair usage policies with configurable limits
- **Real-time Monitoring**: Prometheus metrics and health checks
- **Multi-environment Support**: Development, staging, and production endpoints
- **OpenAPI 3.0 Specification**: Complete API schema with validation

---

## Quick Start

### Authentication

**Bearer Token (Recommended):**
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://api.sxc.codes/v1/projects
```

**API Key:**
```bash
curl -H "X-API-Key: YOUR_API_KEY" \
  https://api.sxc.codes/v1/projects
```

### Base URLs

- **Production**: `https://api.sxc.codes/v1`
- **Staging**: `https://api-staging.sxc.codes/v1`
- **Development**: `http://localhost:3000/v1`

### Health Check

Verify API availability:
```bash
curl https://api.sxc.codes/v1/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00Z",
  "version": "1.0.0",
  "uptime": 86400,
  "environment": "production"
}
```

---

## Core Endpoints

### Projects Management

**List Projects:**
```bash
GET /v1/projects?page=1&limit=20&status=active
```

**Create Project:**
```bash
POST /v1/projects
Content-Type: application/json

{
  "name": "Legacy System Modernization",
  "description": "Transform legacy e-commerce platform",
  "type": "modernization",
  "technology_stack": ["nodejs", "docker", "kubernetes"]
}
```

**Get Project Details:**
```bash
GET /v1/projects/{projectId}
```

**Update Project:**
```bash
PUT /v1/projects/{projectId}
Content-Type: application/json

{
  "status": "active",
  "environment_urls": {
    "staging": "https://staging.example.com",
    "production": "https://production.example.com"
  }
}
```

### Deployments Management

**List Project Deployments:**
```bash
GET /v1/projects/{projectId}/deployments
```

**Create Deployment:**
```bash
POST /v1/projects/{projectId}/deployments
Content-Type: application/json

{
  "environment": "staging",
  "version": "1.2.0",
  "commit_hash": "abc123def456"
}
```

### Monitoring and Observability

**Prometheus Metrics:**
```bash
GET /v1/metrics
```

**System Health:**
```bash
GET /v1/health
```

---

## Request/Response Examples

### Project Creation Example

**Request:**
```http
POST /v1/projects HTTP/1.1
Host: api.sxc.codes
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "DnDDiceRoller Modernization",
  "description": "Transform legacy dice rolling platform",
  "type": "modernization",
  "technology_stack": ["javascript", "docker", "kubernetes", "prometheus"]
}
```

**Response:**
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "DnDDiceRoller Modernization",
  "description": "Transform legacy dice rolling platform",
  "status": "planning",
  "type": "modernization",
  "technology_stack": ["javascript", "docker", "kubernetes", "prometheus"],
  "environment_urls": {},
  "metrics": {
    "uptime_percentage": null,
    "average_response_time_ms": null,
    "deployment_frequency": null,
    "lead_time_hours": null,
    "mttr_minutes": null
  },
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": "2024-01-01T12:00:00Z"
}
```

### Deployment Creation Example

**Request:**
```http
POST /v1/projects/550e8400-e29b-41d4-a716-446655440000/deployments HTTP/1.1
Host: api.sxc.codes
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "environment": "staging",
  "version": "1.0.0",
  "commit_hash": "a1b2c3d4e5f6"
}
```

**Response:**
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": "660f9500-f3ac-52e5-b827-557766551111",
  "project_id": "550e8400-e29b-41d4-a716-446655440000",
  "environment": "staging",
  "version": "1.0.0",
  "status": "pending",
  "commit_hash": "a1b2c3d4e5f6",
  "deployed_by": "api-user",
  "started_at": "2024-01-01T12:00:00Z",
  "completed_at": null,
  "logs_url": "https://logs.sxc.codes/deployments/660f9500-f3ac-52e5-b827-557766551111"
}
```

---

## Error Handling

### Standard Error Format

All API errors follow a consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "field": "name",
      "issue": "Name is required and cannot be empty"
    },
    "timestamp": "2024-01-01T12:00:00Z",
    "request_id": "req_123456789"
  }
}
```

### Common HTTP Status Codes

- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request parameters
- **401 Unauthorized**: Authentication required or invalid
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error occurred

### Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| `VALIDATION_ERROR` | Request validation failed | Check request parameters and format |
| `UNAUTHORIZED` | Authentication required | Provide valid Bearer token or API key |
| `FORBIDDEN` | Insufficient permissions | Contact administrator for access |
| `NOT_FOUND` | Resource not found | Verify resource ID and existence |
| `RATE_LIMITED` | Too many requests | Implement exponential backoff |
| `INTERNAL_ERROR` | Server error | Retry request or contact support |

---

## Rate Limiting

### Default Limits

- **Authenticated Users**: 1000 requests per hour
- **Premium Users**: 5000 requests per hour
- **Unauthenticated**: 100 requests per hour

### Rate Limit Headers

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
X-RateLimit-Window: 3600
```

### Handling Rate Limits

When rate limited (HTTP 429), implement exponential backoff:

```javascript
const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
await new Promise(resolve => setTimeout(resolve, delay));
```

---

## Authentication

### JWT Bearer Tokens

**Obtaining a Token:**
```bash
POST /v1/auth/token
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Using the Token:**
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://api.sxc.codes/v1/projects
```

### API Keys

**Using API Keys:**
```bash
curl -H "X-API-Key: YOUR_API_KEY" \
  https://api.sxc.codes/v1/projects
```

**API Key Management:**
- Request API keys through the dashboard or contact support
- Keys can be scoped to specific resources and permissions
- Regular key rotation is recommended for security

---

## Pagination

### Request Parameters

- `page`: Page number (default: 1, minimum: 1)
- `limit`: Items per page (default: 20, maximum: 100)

### Response Format

```json
{
  "projects": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total_pages": 5,
    "total_items": 100
  }
}
```

### Navigation Links

Use pagination metadata to build navigation:

```javascript
const nextPage = pagination.page < pagination.total_pages ? 
  pagination.page + 1 : null;
const prevPage = pagination.page > 1 ? 
  pagination.page - 1 : null;
```

---

## Monitoring and Observability

### Prometheus Metrics

**Endpoint:** `GET /v1/metrics`

**Key Metrics:**
- `api_requests_total`: Total API requests by endpoint and method
- `api_request_duration_seconds`: Request duration histogram  
- `api_active_connections`: Current active connections
- `api_errors_total`: Total errors by type and endpoint

**Example Metrics:**
```
# HELP api_requests_total Total number of API requests
# TYPE api_requests_total counter
api_requests_total{method="GET",endpoint="/v1/projects",status="200"} 1500

# HELP api_request_duration_seconds API request duration
# TYPE api_request_duration_seconds histogram
api_request_duration_seconds_bucket{method="GET",endpoint="/v1/projects",le="0.1"} 1200
api_request_duration_seconds_bucket{method="GET",endpoint="/v1/projects",le="0.5"} 1450
```

### Health Checks

**Endpoint:** `GET /v1/health`

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00Z",
  "version": "1.0.0",
  "uptime": 86400,
  "environment": "production",
  "checks": {
    "database": "healthy",
    "redis": "healthy",
    "external_apis": "healthy"
  }
}
```

---

## SDKs and Client Libraries

### Official SDKs

- **JavaScript/TypeScript**: `@chasewhiterabbit/api-client`
- **Python**: `chasewhiterabbit-api-client`
- **Go**: `github.com/tiation/chasewhiterabbit-go-client`

### JavaScript Example

```javascript
import { ChaseWhiteRabbitAPI } from '@chasewhiterabbit/api-client';

const client = new ChaseWhiteRabbitAPI({
  apiKey: process.env.CHASEWHITERABBIT_API_KEY,
  baseURL: 'https://api.sxc.codes/v1'
});

const projects = await client.projects.list({
  status: 'active',
  limit: 50
});

const newProject = await client.projects.create({
  name: 'Legacy System Modernization',
  type: 'modernization',
  technology_stack: ['nodejs', 'docker']
});
```

### Python Example

```python
from chasewhiterabbit import ChaseWhiteRabbitAPI

client = ChaseWhiteRabbitAPI(
    api_key=os.environ['CHASEWHITERABBIT_API_KEY'],
    base_url='https://api.sxc.codes/v1'
)

projects = client.projects.list(status='active', limit=50)

new_project = client.projects.create({
    'name': 'Legacy System Modernization',
    'type': 'modernization',
    'technology_stack': ['python', 'docker', 'kubernetes']
})
```

---

## OpenAPI Specification

### Accessing the Specification

- **OpenAPI 3.0 YAML**: `docs/api/openapi.yaml`
- **Interactive Documentation**: `https://api.sxc.codes/docs`
- **Swagger UI**: `https://api.sxc.codes/swagger-ui`

### Code Generation

Generate client libraries using the OpenAPI specification:

```bash
# Generate TypeScript client
openapi-generator-cli generate \
  -i docs/api/openapi.yaml \
  -g typescript-axios \
  -o ./generated/typescript-client

# Generate Python client
openapi-generator-cli generate \
  -i docs/api/openapi.yaml \
  -g python \
  -o ./generated/python-client
```

---

## Webhooks

### Event Notifications

Subscribe to project and deployment events:

**Supported Events:**
- `project.created`
- `project.updated`
- `project.deleted`
- `deployment.started`
- `deployment.completed`
- `deployment.failed`

**Webhook Payload Example:**
```json
{
  "event": "deployment.completed",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "deployment_id": "660f9500-f3ac-52e5-b827-557766551111",
    "project_id": "550e8400-e29b-41d4-a716-446655440000",
    "environment": "production",
    "status": "success",
    "version": "1.0.0"
  }
}
```

---

## Support and Resources

### Getting Help

- **Documentation**: Complete API documentation available
- **Community**: GitHub Discussions and Issues
- **Support Email**: api-support@sxc.codes
- **Status Page**: https://status.sxc.codes

### Best Practices

1. **Authentication**: Use JWT tokens for user operations, API keys for service-to-service
2. **Rate Limiting**: Implement exponential backoff for rate limit handling
3. **Error Handling**: Check HTTP status codes and parse error responses
4. **Monitoring**: Monitor API usage and implement health checks
5. **Versioning**: Always specify API version in requests

### Change Log

- **v1.0.0** (2024-01-01): Initial API release
  - Projects and deployments management
  - Authentication and rate limiting
  - Monitoring and observability endpoints

---

*For the complete OpenAPI 3.0 specification, see [openapi.yaml](./openapi.yaml)*
