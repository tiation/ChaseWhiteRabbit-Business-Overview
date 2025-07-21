/**
 * ChaseWhiteRabbit Metrics Service
 * Enterprise-grade Prometheus metrics collection
 * 
 * @version 1.0.0
 * @description Handles application metrics for observability and monitoring
 */

'use strict';

const promClient = require('prom-client');

class MetricsService {
    constructor() {
        this.isInitialized = false;
        this.metrics = {};
        
        // Configuration
        this.defaultLabels = {
            app: 'chasewhiterabbit',
            version: process.env.VERSION || '1.0.0',
            environment: process.env.NODE_ENV || 'development'
        };
    }

    /**
     * Initialize metrics collection
     */
    init() {
        if (this.isInitialized) {
            return;
        }

        // Set default labels
        promClient.register.setDefaultLabels(this.defaultLabels);

        // Enable default metrics (CPU, memory, etc.)
        promClient.collectDefaultMetrics({
            timeout: 5000,
            gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
            register: promClient.register
        });

        this.createCustomMetrics();
        this.isInitialized = true;
    }

    /**
     * Create application-specific metrics
     */
    createCustomMetrics() {
        // HTTP request duration
        this.metrics.httpRequestDuration = new promClient.Histogram({
            name: 'chasewhiterabbit_http_request_duration_seconds',
            help: 'Duration of HTTP requests in seconds',
            labelNames: ['method', 'route', 'status_code'],
            buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5]
        });

        // HTTP request count
        this.metrics.httpRequestTotal = new promClient.Counter({
            name: 'chasewhiterabbit_http_requests_total',
            help: 'Total number of HTTP requests',
            labelNames: ['method', 'route', 'status_code']
        });

        // Dice roll metrics
        this.metrics.diceRollsTotal = new promClient.Counter({
            name: 'chasewhiterabbit_dice_rolls_total',
            help: 'Total number of dice rolls',
            labelNames: ['dice_type', 'count']
        });

        this.metrics.diceRollValue = new promClient.Histogram({
            name: 'chasewhiterabbit_dice_roll_value',
            help: 'Distribution of dice roll values',
            labelNames: ['dice_type'],
            buckets: [1, 2, 5, 10, 15, 20, 25, 30, 50, 75, 100]
        });

        this.metrics.criticalHitsTotal = new promClient.Counter({
            name: 'chasewhiterabbit_critical_hits_total',
            help: 'Total number of critical hits (natural 20s)',
            labelNames: ['dice_type']
        });

        this.metrics.criticalFailsTotal = new promClient.Counter({
            name: 'chasewhiterabbit_critical_fails_total',
            help: 'Total number of critical fails (natural 1s)',
            labelNames: ['dice_type']
        });

        // Application health metrics
        this.metrics.healthCheckStatus = new promClient.Gauge({
            name: 'chasewhiterabbit_health_check_status',
            help: 'Health check status (1 = healthy, 0 = unhealthy)',
            labelNames: ['check_type']
        });

        this.metrics.activeUsers = new promClient.Gauge({
            name: 'chasewhiterabbit_active_users',
            help: 'Number of active users'
        });

        this.metrics.rollHistory = new promClient.Gauge({
            name: 'chasewhiterabbit_roll_history_size',
            help: 'Current size of roll history'
        });

        // Error metrics
        this.metrics.errorTotal = new promClient.Counter({
            name: 'chasewhiterabbit_errors_total',
            help: 'Total number of application errors',
            labelNames: ['error_type', 'error_code']
        });

        // Business metrics
        this.metrics.sessionDuration = new promClient.Histogram({
            name: 'chasewhiterabbit_session_duration_seconds',
            help: 'Duration of user sessions in seconds',
            buckets: [30, 60, 300, 600, 1800, 3600, 7200]
        });

        this.metrics.averageRollValue = new promClient.Gauge({
            name: 'chasewhiterabbit_average_roll_value',
            help: 'Average dice roll value by type',
            labelNames: ['dice_type']
        });

        // Performance metrics
        this.metrics.responseTimeTarget = new promClient.Gauge({
            name: 'chasewhiterabbit_response_time_target_seconds',
            help: 'Target response time threshold'
        });

        // Set initial values
        this.metrics.responseTimeTarget.set(parseFloat(process.env.RESPONSE_TIME_TARGET || '0.1'));
    }

    /**
     * Record HTTP request metrics
     * @param {string} method - HTTP method
     * @param {string} route - Route path
     * @param {number} statusCode - HTTP status code
     * @param {number} duration - Request duration in seconds
     */
    recordHttpRequest(method, route, statusCode, duration) {
        if (!this.isInitialized) return;

        const labels = { method, route, status_code: statusCode };
        
        this.metrics.httpRequestTotal.inc(labels);
        this.metrics.httpRequestDuration.observe(labels, duration);
    }

    /**
     * Record dice roll metrics
     * @param {string} diceType - Type of dice
     * @param {number} count - Number of dice rolled
     * @param {number} value - Total roll value
     * @param {boolean} isCriticalHit - Whether this was a critical hit
     * @param {boolean} isCriticalFail - Whether this was a critical fail
     */
    recordDiceRoll(diceType, count, value, isCriticalHit = false, isCriticalFail = false) {
        if (!this.isInitialized) return;

        const labels = { dice_type: diceType, count: count.toString() };
        
        this.metrics.diceRollsTotal.inc(labels);
        this.metrics.diceRollValue.observe({ dice_type: diceType }, value);

        if (isCriticalHit) {
            this.metrics.criticalHitsTotal.inc({ dice_type: diceType });
        }

        if (isCriticalFail) {
            this.metrics.criticalFailsTotal.inc({ dice_type: diceType });
        }
    }

    /**
     * Record application error
     * @param {string} errorType - Type of error
     * @param {string} errorCode - Error code
     */
    recordError(errorType, errorCode = 'unknown') {
        if (!this.isInitialized) return;

        this.metrics.errorTotal.inc({
            error_type: errorType,
            error_code: errorCode
        });
    }

    /**
     * Update health check status
     * @param {string} checkType - Type of health check
     * @param {boolean} isHealthy - Health status
     */
    updateHealthStatus(checkType, isHealthy) {
        if (!this.isInitialized) return;

        this.metrics.healthCheckStatus.set(
            { check_type: checkType },
            isHealthy ? 1 : 0
        );
    }

    /**
     * Update active users count
     * @param {number} count - Number of active users
     */
    updateActiveUsers(count) {
        if (!this.isInitialized) return;
        this.metrics.activeUsers.set(count);
    }

    /**
     * Update roll history size
     * @param {number} size - Current history size
     */
    updateRollHistorySize(size) {
        if (!this.isInitialized) return;
        this.metrics.rollHistory.set(size);
    }

    /**
     * Record session duration
     * @param {number} duration - Session duration in seconds
     */
    recordSessionDuration(duration) {
        if (!this.isInitialized) return;
        this.metrics.sessionDuration.observe(duration);
    }

    /**
     * Update average roll value for a dice type
     * @param {string} diceType - Type of dice
     * @param {number} average - Average roll value
     */
    updateAverageRollValue(diceType, average) {
        if (!this.isInitialized) return;
        this.metrics.averageRollValue.set({ dice_type: diceType }, average);
    }

    /**
     * Get current metrics as text
     * @returns {string} Metrics in Prometheus format
     */
    async getMetrics() {
        if (!this.isInitialized) {
            this.init();
        }
        
        return await promClient.register.metrics();
    }

    /**
     * Reset all metrics (useful for testing)
     */
    reset() {
        promClient.register.clear();
        this.isInitialized = false;
        this.metrics = {};
    }

    /**
     * Create custom gauge metric
     * @param {string} name - Metric name
     * @param {string} help - Metric description
     * @param {Array} labelNames - Label names
     * @returns {Object} Prometheus gauge
     */
    createGauge(name, help, labelNames = []) {
        return new promClient.Gauge({
            name: `chasewhiterabbit_${name}`,
            help,
            labelNames
        });
    }

    /**
     * Create custom counter metric
     * @param {string} name - Metric name
     * @param {string} help - Metric description
     * @param {Array} labelNames - Label names
     * @returns {Object} Prometheus counter
     */
    createCounter(name, help, labelNames = []) {
        return new promClient.Counter({
            name: `chasewhiterabbit_${name}`,
            help,
            labelNames
        });
    }

    /**
     * Create custom histogram metric
     * @param {string} name - Metric name
     * @param {string} help - Metric description
     * @param {Array} labelNames - Label names
     * @param {Array} buckets - Histogram buckets
     * @returns {Object} Prometheus histogram
     */
    createHistogram(name, help, labelNames = [], buckets = undefined) {
        return new promClient.Histogram({
            name: `chasewhiterabbit_${name}`,
            help,
            labelNames,
            buckets
        });
    }
}

// Create singleton instance
const metricsService = new MetricsService();

module.exports = metricsService;
