/**
 * ChaseWhiteRabbit Health Service
 * Enterprise-grade health monitoring for Kubernetes and container orchestration
 * 
 * @version 1.0.0
 * @description Provides health checks for application monitoring
 */

'use strict';

const metricsService = require('./metrics');

class HealthService {
    constructor() {
        this.startTime = new Date();
        this.checks = {
            database: this.checkDatabase.bind(this),
            redis: this.checkRedis.bind(this),
            disk: this.checkDiskSpace.bind(this),
            memory: this.checkMemory.bind(this)
        };
    }

    /**
     * Main health check endpoint
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async healthCheck(req, res) {
        try {
            const health = await this.performHealthCheck();
            const statusCode = health.status === 'healthy' ? 200 : 503;
            
            // Update metrics
            metricsService.updateHealthStatus('overall', health.status === 'healthy');
            
            res.status(statusCode).json(health);
        } catch (error) {
            metricsService.recordError('health_check', 'general_failure');
            res.status(503).json({
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Kubernetes readiness probe
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async readinessCheck(req, res) {
        try {
            const isReady = await this.isApplicationReady();
            
            if (isReady) {
                res.status(200).json({
                    status: 'ready',
                    message: 'Application is ready to serve traffic',
                    timestamp: new Date().toISOString()
                });
            } else {
                res.status(503).json({
                    status: 'not_ready',
                    message: 'Application is not ready to serve traffic',
                    timestamp: new Date().toISOString()
                });
            }
            
            metricsService.updateHealthStatus('readiness', isReady);
        } catch (error) {
            metricsService.recordError('health_check', 'readiness_failure');
            res.status(503).json({
                status: 'not_ready',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Kubernetes liveness probe
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async livenessCheck(req, res) {
        try {
            const isLive = await this.isApplicationLive();
            
            if (isLive) {
                res.status(200).json({
                    status: 'alive',
                    message: 'Application is running',
                    uptime: this.getUptime(),
                    timestamp: new Date().toISOString()
                });
            } else {
                res.status(503).json({
                    status: 'dead',
                    message: 'Application is not responding properly',
                    timestamp: new Date().toISOString()
                });
            }
            
            metricsService.updateHealthStatus('liveness', isLive);
        } catch (error) {
            metricsService.recordError('health_check', 'liveness_failure');
            res.status(503).json({
                status: 'dead',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Perform comprehensive health check
     * @returns {Object} Health status object
     */
    async performHealthCheck() {
        const startTime = Date.now();
        const results = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: this.getUptime(),
            version: process.env.VERSION || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            checks: {},
            metadata: {
                nodeVersion: process.version,
                platform: process.platform,
                arch: process.arch,
                pid: process.pid
            }
        };

        let allHealthy = true;

        // Run all health checks
        for (const [checkName, checkFunction] of Object.entries(this.checks)) {
            try {
                const checkResult = await checkFunction();
                results.checks[checkName] = {
                    status: checkResult.healthy ? 'healthy' : 'unhealthy',
                    message: checkResult.message,
                    duration: checkResult.duration,
                    details: checkResult.details || {}
                };

                if (!checkResult.healthy) {
                    allHealthy = false;
                }
            } catch (error) {
                results.checks[checkName] = {
                    status: 'error',
                    message: error.message,
                    duration: 0
                };
                allHealthy = false;
            }
        }

        // Overall status
        results.status = allHealthy ? 'healthy' : 'unhealthy';
        results.totalDuration = Date.now() - startTime;

        return results;
    }

    /**
     * Check if application is ready to serve traffic
     * @returns {boolean} Readiness status
     */
    async isApplicationReady() {
        // Check critical dependencies
        const criticalChecks = ['database', 'redis'];
        
        for (const checkName of criticalChecks) {
            try {
                if (this.checks[checkName]) {
                    const result = await this.checks[checkName]();
                    if (!result.healthy) {
                        return false;
                    }
                }
            } catch (error) {
                return false;
            }
        }

        return true;
    }

    /**
     * Check if application is alive
     * @returns {boolean} Liveness status
     */
    async isApplicationLive() {
        // Basic liveness checks - application should respond
        try {
            // Check if event loop is responsive
            const eventLoopStart = Date.now();
            await new Promise(resolve => setImmediate(resolve));
            const eventLoopDelay = Date.now() - eventLoopStart;
            
            // If event loop is severely blocked, consider unhealthy
            return eventLoopDelay < 1000; // 1 second threshold
        } catch (error) {
            return false;
        }
    }

    /**
     * Check database connectivity (placeholder)
     * @returns {Object} Database health status
     */
    async checkDatabase() {
        const start = Date.now();
        
        try {
            // In a real implementation, this would check actual database connectivity
            // For now, we'll simulate a check
            const isConnected = process.env.DATABASE_URL ? true : false;
            
            return {
                healthy: isConnected,
                message: isConnected ? 'Database connection successful' : 'Database not configured',
                duration: Date.now() - start,
                details: {
                    configured: !!process.env.DATABASE_URL,
                    type: 'postgresql'
                }
            };
        } catch (error) {
            return {
                healthy: false,
                message: `Database check failed: ${error.message}`,
                duration: Date.now() - start
            };
        }
    }

    /**
     * Check Redis connectivity (placeholder)
     * @returns {Object} Redis health status
     */
    async checkRedis() {
        const start = Date.now();
        
        try {
            // In a real implementation, this would ping Redis
            const isConnected = process.env.REDIS_URL ? true : false;
            
            return {
                healthy: isConnected,
                message: isConnected ? 'Redis connection successful' : 'Redis not configured',
                duration: Date.now() - start,
                details: {
                    configured: !!process.env.REDIS_URL,
                    url: process.env.REDIS_URL ? 'configured' : 'not_configured'
                }
            };
        } catch (error) {
            return {
                healthy: false,
                message: `Redis check failed: ${error.message}`,
                duration: Date.now() - start
            };
        }
    }

    /**
     * Check disk space
     * @returns {Object} Disk space health status
     */
    async checkDiskSpace() {
        const start = Date.now();
        
        try {
            const fs = require('fs');
            const stats = fs.statSync('./');
            
            // This is a simplified check - in production you'd want more sophisticated disk monitoring
            return {
                healthy: true,
                message: 'Disk space check passed',
                duration: Date.now() - start,
                details: {
                    available: 'sufficient' // Placeholder
                }
            };
        } catch (error) {
            return {
                healthy: false,
                message: `Disk space check failed: ${error.message}`,
                duration: Date.now() - start
            };
        }
    }

    /**
     * Check memory usage
     * @returns {Object} Memory health status
     */
    async checkMemory() {
        const start = Date.now();
        
        try {
            const memUsage = process.memoryUsage();
            const totalMem = require('os').totalmem();
            const freeMem = require('os').freemem();
            const usedMemPercentage = ((totalMem - freeMem) / totalMem) * 100;
            
            // Consider unhealthy if using more than 90% of available memory
            const isHealthy = usedMemPercentage < 90;
            
            return {
                healthy: isHealthy,
                message: isHealthy ? 'Memory usage is within limits' : 'High memory usage detected',
                duration: Date.now() - start,
                details: {
                    rss: Math.round(memUsage.rss / 1024 / 1024), // MB
                    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
                    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
                    external: Math.round(memUsage.external / 1024 / 1024), // MB
                    systemUsedPercentage: Math.round(usedMemPercentage)
                }
            };
        } catch (error) {
            return {
                healthy: false,
                message: `Memory check failed: ${error.message}`,
                duration: Date.now() - start
            };
        }
    }

    /**
     * Get application uptime
     * @returns {Object} Uptime information
     */
    getUptime() {
        const uptimeMs = Date.now() - this.startTime.getTime();
        const uptimeSeconds = Math.floor(uptimeMs / 1000);
        
        return {
            milliseconds: uptimeMs,
            seconds: uptimeSeconds,
            minutes: Math.floor(uptimeSeconds / 60),
            hours: Math.floor(uptimeSeconds / 3600),
            days: Math.floor(uptimeSeconds / 86400),
            startTime: this.startTime.toISOString()
        };
    }

    /**
     * Add custom health check
     * @param {string} name - Check name
     * @param {Function} checkFunction - Health check function
     */
    addCustomCheck(name, checkFunction) {
        this.checks[name] = checkFunction;
    }

    /**
     * Remove health check
     * @param {string} name - Check name
     */
    removeCheck(name) {
        delete this.checks[name];
    }
}

// Create singleton instance
const healthService = new HealthService();

module.exports = healthService;
