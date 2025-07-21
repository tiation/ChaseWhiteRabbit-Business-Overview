/**
 * ChaseWhiteRabbit Request Logger
 * Enterprise-grade request logging middleware
 */

'use strict';

const metricsService = require('../services/metrics');

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
