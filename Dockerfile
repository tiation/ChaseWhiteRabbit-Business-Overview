# ChaseWhiteRabbit Production Dockerfile
# Multi-stage build for optimized production image

# Stage 1: Build Environment
FROM node:18-alpine AS builder

LABEL maintainer="ChaseWhiteRabbit Team <tiatheone@protonmail.com>"
LABEL version="1.0.0"
LABEL description="ChaseWhiteRabbit - Enterprise Digital Transformation Initiative"

WORKDIR /app

# Copy package files for dependency caching
COPY package*.json ./
COPY demo-repository/package*.json ./demo-repository/

# Install dependencies with production optimizations
RUN npm ci --only=production && \
    npm cache clean --force && \
    rm -rf /tmp/* /var/cache/apk/*

# Copy source code and build assets
COPY . .

# Build the application
RUN if [ -f "package.json" ]; then \
        npm run build --if-present; \
    fi

# Stage 2: Production Runtime
FROM nginx:alpine AS production

# Install security updates and essential tools
RUN apk update && apk upgrade && \
    apk add --no-cache \
        curl \
        jq \
        tzdata && \
    rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S chasewhiterabbit && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G chasewhiterabbit -g chasewhiterabbit chasewhiterabbit

# Copy built application from builder stage
COPY --from=builder --chown=chasewhiterabbit:chasewhiterabbit /app /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Set up health check endpoint
COPY scripts/health-check.sh /usr/local/bin/health-check.sh
RUN chmod +x /usr/local/bin/health-check.sh

# Configure nginx to run as non-root
RUN touch /var/run/nginx.pid && \
    chown -R chasewhiterabbit:chasewhiterabbit /var/cache/nginx /var/run/nginx.pid /var/log/nginx

# Security: Remove unnecessary files
RUN rm -rf /usr/share/nginx/html/node_modules \
           /usr/share/nginx/html/.git \
           /usr/share/nginx/html/tests \
           /usr/share/nginx/html/scripts/ci-cd

# Switch to non-root user
USER chasewhiterabbit

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD /usr/local/bin/health-check.sh

# Expose application port
EXPOSE 8080

# Metadata labels for enterprise tracking
LABEL org.opencontainers.image.source="https://github.com/ChaseWhiteRabbit/ChaseWhiteRabbit-Business-Overview"
LABEL org.opencontainers.image.vendor="ChaseWhiteRabbit Digital Transformation Initiative"
LABEL org.opencontainers.image.licenses="MIT"

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
