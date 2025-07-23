/**
 * ChaseWhiteRabbit Request Logger
 * Enterprise-grade request logging middleware with audit trail integration
 * SOC2 and ISO 27001 compliant request logging
 */

'use strict';

const metricsService = require('../services/metrics');
const auditLogger = require('../services/auditLogger');

class RequestLogger {
    /**
     * Express request logging middleware
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Next middleware function
     */
    static middleware(req, res, next) {
        const startTime = Date.now();
        
        // Override res.end to capture response details
        const originalEnd = res.end;
        res.end = function(...args) {
            const duration = (Date.now() - startTime) / 1000; // Convert to seconds
            const statusCode = res.statusCode;
            const durationMs = Date.now() - startTime;
            
            // Log request details
            const logData = {
                method: req.method,
                url: req.url,
                statusCode,
                duration,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                contentLength: res.get('Content-Length') || 0,
                timestamp: new Date().toISOString()
            };

            // Record metrics
            const route = RequestLogger.getRoutePattern(req.route, req.url);
            metricsService.recordHttpRequest(req.method, route, statusCode, duration);

            // Enhanced audit logging for compliance
            const outcome = statusCode < 400 ? 'success' : 'failure';
            
            // Log all API requests with full audit trail
            auditLogger.logApiRequest(req, res, durationMs, outcome);
            
            // Log specific security-relevant events
            RequestLogger.logSecurityEvents(req, res, statusCode);

            // Console log in development
            if (process.env.NODE_ENV !== 'production') {
                const statusColor = RequestLogger.getStatusColor(statusCode);
                console.log(
                    `${logData.timestamp} ${statusColor}${req.method}${RequestLogger.colors.reset} ` +
                    `${logData.url} ${statusColor}${statusCode}${RequestLogger.colors.reset} ` +
                    `${duration.toFixed(3)}s ${logData.ip}`
                );
            }

            // Call original end method
            originalEnd.apply(res, args);
        };

        next();
    }

    /**
     * Get route pattern for metrics
     * @param {Object} route - Express route object
     * @param {string} url - Request URL
     * @returns {string} Route pattern
     */
    static getRoutePattern(route, url) {
        if (route && route.path) {
            return route.path;
        }

        // Extract pattern from common routes
        if (url.startsWith('/api/')) {
            const parts = url.split('/');
            if (parts.length >= 3) {
                return `/api/${parts[2]}`;
            }
            return '/api';
        }

        if (url === '/') return '/';
        if (url.startsWith('/health')) return '/health';
        if (url.startsWith('/metrics')) return '/metrics';
        if (url.startsWith('/assets/')) return '/assets';

        return 'unknown';
    }

    /**
     * Get color for status code (for console output)
     * @param {number} statusCode - HTTP status code
     * @returns {string} ANSI color code
     */
    static getStatusColor(statusCode) {
        if (statusCode >= 200 && statusCode < 300) {
            return RequestLogger.colors.green;
        } else if (statusCode >= 300 && statusCode < 400) {
            return RequestLogger.colors.yellow;
        } else if (statusCode >= 400 && statusCode < 500) {
            return RequestLogger.colors.red;
        } else if (statusCode >= 500) {
            return RequestLogger.colors.magenta;
        }
        return RequestLogger.colors.reset;
    }

    /**
     * Log security-relevant events based on request patterns
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {number} statusCode - HTTP status code
     */
    static logSecurityEvents(req, res, statusCode) {
        // Log authentication failures
        if (statusCode === 401) {
            auditLogger.logAuthentication(
                auditLogger.eventTypes.AUTH_LOGIN_FAILED,
                req.user?.id || 'anonymous',
                req.user?.email || req.body?.email || 'unknown',
                req.ip,
                req.get('User-Agent'),
                'failure',
                {
                    endpoint: req.originalUrl,
                    method: req.method,
                    reason: 'invalid_credentials'
                }
            );
        }

        // Log authorization failures
        if (statusCode === 403) {
            auditLogger.logEvent(auditLogger.eventTypes.AUTHZ_ACCESS_DENIED, {
                user: { id: req.user?.id, email: req.user?.email },
                request: { 
                    ip: req.ip, 
                    user_agent: req.get('User-Agent'),
                    method: req.method,
                    url: req.originalUrl
                },
                resource: { type: 'endpoint', id: req.originalUrl },
                outcome: 'denied',
                details: { reason: 'insufficient_permissions' }
            });
        }

        // Log potential security threats
        if (statusCode === 429) {
            auditLogger.logEvent(auditLogger.eventTypes.API_RATE_LIMIT_EXCEEDED, {
                request: { 
                    ip: req.ip, 
                    user_agent: req.get('User-Agent'),
                    endpoint: req.originalUrl
                },
                outcome: 'blocked',
                details: { 
                    threat_type: 'rate_limit_exceeded',
                    requests_per_window: 'exceeded'
                }
            });
        }

        // Log data access for sensitive endpoints
        if (RequestLogger.isSensitiveEndpoint(req.originalUrl) && statusCode < 300) {
            const eventType = RequestLogger.getDataEventType(req.method);
            if (eventType) {
                auditLogger.logDataAccess(
                    eventType,
                    req.user?.id || 'anonymous',
                    'api_endpoint',
                    req.originalUrl,
                    'success',
                    {
                        method: req.method,
                        query_params: req.query,
                        user_agent: req.get('User-Agent')
                    }
                );
            }
        }

        // Log admin or audit endpoint access
        if (req.originalUrl.includes('/admin/') || req.originalUrl.includes('/audit/')) {
            auditLogger.logEvent(auditLogger.eventTypes.AUTHZ_ACCESS_GRANTED, {
                user: { id: req.user?.id, email: req.user?.email },
                request: { 
                    ip: req.ip, 
                    user_agent: req.get('User-Agent'),
                    method: req.method,
                    url: req.originalUrl
                },
                resource: { type: 'privileged_endpoint', id: req.originalUrl },
                outcome: statusCode < 400 ? 'granted' : 'denied',
                details: { 
                    endpoint_type: req.originalUrl.includes('/audit/') ? 'audit' : 'admin',
                    status_code: statusCode
                }
            });
        }
    }

    /**
     * Check if endpoint handles sensitive data
     * @param {string} url - Request URL
     * @returns {boolean} True if endpoint is sensitive
     */
    static isSensitiveEndpoint(url) {
        const sensitivePatterns = [
            '/api/users/',
            '/api/admin/',
            '/api/audit/',
            '/api/compliance/',
            '/api/security/',
            '/api/config/',
            '/api/auth/'
        ];
        
        return sensitivePatterns.some(pattern => url.includes(pattern));
    }

    /**
     * Get audit event type based on HTTP method
     * @param {string} method - HTTP method
     * @returns {string|null} Audit event type
     */
    static getDataEventType(method) {
        switch (method.toUpperCase()) {
            case 'GET':
                return auditLogger.eventTypes.DATA_READ;
            case 'POST':
                return auditLogger.eventTypes.DATA_CREATE;
            case 'PUT':
            case 'PATCH':
                return auditLogger.eventTypes.DATA_UPDATE;
            case 'DELETE':
                return auditLogger.eventTypes.DATA_DELETE;
            default:
                return null;
        }
    }

    /**
     * ANSI color codes for console output
     */
    static colors = {
        reset: '\x1b[0m',
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        magenta: '\x1b[35m',
        cyan: '\x1b[36m'
    };
}

module.exports = RequestLogger;
