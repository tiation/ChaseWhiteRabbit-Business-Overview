#!/usr/bin/env node
/**
 * Enterprise Audit Logging Service
 * SOC2 and ISO 27001 Compliant Audit Trail Management
 * 
 * @version 1.0.0
 * @author ChaseWhiteRabbit Team <tiatheone@protonmail.com>
 * @description Comprehensive audit logging for compliance and security monitoring
 */

'use strict';

const { createLogger, format, transports } = require('winston');
const ElasticsearchTransport = require('winston-elasticsearch');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

class AuditLogger {
    constructor() {
        this.initializeLogger();
        this.eventTypes = {
            // Authentication Events
            AUTH_LOGIN_SUCCESS: 'auth.login.success',
            AUTH_LOGIN_FAILED: 'auth.login.failed',
            AUTH_LOGOUT: 'auth.logout',
            AUTH_TOKEN_REFRESH: 'auth.token.refresh',
            AUTH_PASSWORD_CHANGE: 'auth.password.change',
            AUTH_PASSWORD_RESET: 'auth.password.reset',
            
            // Authorization Events
            AUTHZ_ACCESS_GRANTED: 'authz.access.granted',
            AUTHZ_ACCESS_DENIED: 'authz.access.denied',
            AUTHZ_PERMISSION_CHANGE: 'authz.permission.change',
            AUTHZ_ROLE_ASSIGNMENT: 'authz.role.assignment',
            
            // Data Access Events
            DATA_READ: 'data.read',
            DATA_CREATE: 'data.create',
            DATA_UPDATE: 'data.update',
            DATA_DELETE: 'data.delete',
            DATA_EXPORT: 'data.export',
            DATA_IMPORT: 'data.import',
            
            // System Events
            SYSTEM_CONFIG_CHANGE: 'system.config.change',
            SYSTEM_STARTUP: 'system.startup',
            SYSTEM_SHUTDOWN: 'system.shutdown',
            SYSTEM_ERROR: 'system.error',
            SYSTEM_MAINTENANCE: 'system.maintenance',
            
            // Security Events
            SECURITY_THREAT_DETECTED: 'security.threat.detected',
            SECURITY_POLICY_VIOLATION: 'security.policy.violation',
            SECURITY_VULNERABILITY_SCAN: 'security.vulnerability.scan',
            SECURITY_INCIDENT_CREATED: 'security.incident.created',
            
            // Compliance Events
            COMPLIANCE_AUDIT_START: 'compliance.audit.start',
            COMPLIANCE_AUDIT_END: 'compliance.audit.end',
            COMPLIANCE_POLICY_UPDATE: 'compliance.policy.update',
            COMPLIANCE_TRAINING_COMPLETED: 'compliance.training.completed',
            
            // API Events
            API_REQUEST: 'api.request',
            API_RATE_LIMIT_EXCEEDED: 'api.rate_limit.exceeded',
            API_DEPRECATION_WARNING: 'api.deprecation.warning'
        };
        
        this.riskLevels = {
            LOW: 'low',
            MEDIUM: 'medium',
            HIGH: 'high',
            CRITICAL: 'critical'
        };
    }
    
    initializeLogger() {
        const auditFormat = format.combine(
            format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
            format.errors({ stack: true }),
            format.json(),
            format.printf(info => {
                const auditEntry = {
                    timestamp: info.timestamp,
                    audit_id: info.audit_id || uuidv4(),
                    event_type: info.event_type,
                    event_category: info.event_category,
                    severity: info.level,
                    risk_level: info.risk_level || 'low',
                    user: info.user || {},
                    session: info.session || {},
                    request: info.request || {},
                    resource: info.resource || {},
                    outcome: info.outcome,
                    details: info.details || {},
                    metadata: {
                        service: 'ChaseWhiteRabbit',
                        environment: process.env.NODE_ENV || 'development',
                        version: process.env.APP_VERSION || '1.0.0',
                        hostname: require('os').hostname(),
                        process_id: process.pid
                    },
                    compliance: {
                        soc2_relevant: info.soc2_relevant || false,
                        iso27001_relevant: info.iso27001_relevant || false,
                        gdpr_relevant: info.gdpr_relevant || false,
                        retention_period: info.retention_period || '7y'
                    }
                };
                
                return JSON.stringify(auditEntry);
            })
        );
        
        const transportsArray = [
            // Dedicated audit log file
            new transports.File({
                filename: 'logs/audit.log',
                level: 'info',
                format: auditFormat,
                maxsize: 100 * 1024 * 1024, // 100MB
                maxFiles: 10,
                tailable: true
            }),
            
            // Critical events separate file
            new transports.File({
                filename: 'logs/audit-critical.log',
                level: 'error',
                format: auditFormat,
                maxsize: 50 * 1024 * 1024, // 50MB
                maxFiles: 20,
                tailable: true
            })
        ];
        
        // Add Elasticsearch transport if configured
        if (process.env.ELASTICSEARCH_URL) {
            const esTransport = new ElasticsearchTransport({
                level: 'info',
                clientOpts: {
                    node: process.env.ELASTICSEARCH_URL,
                    auth: process.env.ELASTICSEARCH_AUTH ? {
                        username: process.env.ELASTICSEARCH_USERNAME,
                        password: process.env.ELASTICSEARCH_PASSWORD
                    } : undefined
                },
                index: 'chasewhiterabbit-audit',
                indexTemplate: {
                    name: 'chasewhiterabbit-audit-template',
                    body: {
                        index_patterns: ['chasewhiterabbit-audit-*'],
                        settings: {
                            number_of_shards: 1,
                            number_of_replicas: 1,
                            'index.lifecycle.name': 'audit-policy',
                            'index.lifecycle.rollover_alias': 'chasewhiterabbit-audit'
                        },
                        mappings: {
                            properties: {
                                timestamp: { type: 'date' },
                                audit_id: { type: 'keyword' },
                                event_type: { type: 'keyword' },
                                event_category: { type: 'keyword' },
                                severity: { type: 'keyword' },
                                risk_level: { type: 'keyword' },
                                'user.id': { type: 'keyword' },
                                'user.email': { type: 'keyword' },
                                'request.ip': { type: 'ip' },
                                'request.user_agent': { type: 'text' },
                                outcome: { type: 'keyword' }
                            }
                        }
                    }
                }
            });
            
            transportsArray.push(esTransport);
        }
        
        // Console transport for development
        if (process.env.NODE_ENV !== 'production') {
            transportsArray.push(new transports.Console({
                format: format.combine(
                    format.colorize(),
                    format.printf(info => {
                        return `[AUDIT] ${info.timestamp} | ${info.event_type} | ${info.level} | ${JSON.stringify(info.details || {})}`;
                    })
                )
            }));
        }
        
        this.logger = createLogger({
            level: 'info',
            transports: transportsArray,
            exitOnError: false
        });
    }
    
    /**
     * Log audit event
     * @param {string} eventType - Type of event from this.eventTypes
     * @param {Object} data - Event data
     */
    logEvent(eventType, data = {}) {
        const auditEntry = {
            audit_id: uuidv4(),
            event_type: eventType,
            event_category: this.getEventCategory(eventType),
            risk_level: data.risk_level || this.getRiskLevel(eventType),
            user: data.user || {},
            session: data.session || {},
            request: data.request || {},
            resource: data.resource || {},
            outcome: data.outcome || 'unknown',
            details: data.details || {},
            soc2_relevant: this.isSoc2Relevant(eventType),
            iso27001_relevant: this.isIso27001Relevant(eventType),
            gdpr_relevant: this.isGdprRelevant(eventType),
            retention_period: data.retention_period || this.getRetentionPeriod(eventType)
        };
        
        const logLevel = this.getLogLevel(eventType, data.outcome);
        this.logger.log(logLevel, 'Audit event', auditEntry);
        
        return auditEntry.audit_id;
    }
    
    /**
     * Log authentication events
     */
    logAuthentication(eventType, userId, email, ip, userAgent, outcome, details = {}) {
        return this.logEvent(eventType, {
            user: { id: userId, email: email },
            request: { ip: ip, user_agent: userAgent },
            outcome: outcome,
            details: details,
            risk_level: outcome === 'success' ? 'low' : 'medium'
        });
    }
    
    /**
     * Log data access events
     */
    logDataAccess(eventType, userId, resourceType, resourceId, outcome, details = {}) {
        return this.logEvent(eventType, {
            user: { id: userId },
            resource: { type: resourceType, id: resourceId },
            outcome: outcome,
            details: details,
            risk_level: eventType === this.eventTypes.DATA_DELETE ? 'high' : 'low'
        });
    }
    
    /**
     * Log API requests
     */
    logApiRequest(req, res, responseTime, outcome = 'success') {
        const eventType = this.eventTypes.API_REQUEST;
        return this.logEvent(eventType, {
            user: { id: req.user?.id, email: req.user?.email },
            request: {
                method: req.method,
                url: req.originalUrl,
                ip: req.ip,
                user_agent: req.get('User-Agent'),
                headers: this.sanitizeHeaders(req.headers)
            },
            resource: {
                endpoint: req.route?.path,
                params: req.params,
                query: req.query
            },
            outcome: outcome,
            details: {
                status_code: res.statusCode,
                response_time_ms: responseTime,
                content_length: res.get('Content-Length')
            },
            risk_level: res.statusCode >= 400 ? 'medium' : 'low'
        });
    }
    
    /**
     * Log security events
     */
    logSecurityEvent(eventType, threat, userId, ip, details = {}) {
        return this.logEvent(eventType, {
            user: { id: userId },
            request: { ip: ip },
            outcome: 'detected',
            details: { threat_type: threat, ...details },
            risk_level: 'high'
        });
    }
    
    /**
     * Log system events
     */
    logSystemEvent(eventType, outcome, details = {}) {
        return this.logEvent(eventType, {
            outcome: outcome,
            details: details,
            risk_level: outcome === 'failure' ? 'high' : 'low'
        });
    }
    
    /**
     * Helper methods
     */
    getEventCategory(eventType) {
        const categories = {
            'auth.': 'authentication',
            'authz.': 'authorization',
            'data.': 'data_access',
            'system.': 'system',
            'security.': 'security',
            'compliance.': 'compliance',
            'api.': 'api'
        };
        
        for (const [prefix, category] of Object.entries(categories)) {
            if (eventType.startsWith(prefix)) {
                return category;
            }
        }
        return 'general';
    }
    
    getRiskLevel(eventType) {
        const highRiskEvents = [
            this.eventTypes.AUTH_LOGIN_FAILED,
            this.eventTypes.AUTHZ_ACCESS_DENIED,
            this.eventTypes.DATA_DELETE,
            this.eventTypes.SECURITY_THREAT_DETECTED,
            this.eventTypes.SECURITY_POLICY_VIOLATION,
            this.eventTypes.SYSTEM_ERROR
        ];
        
        return highRiskEvents.includes(eventType) ? 'high' : 'low';
    }
    
    getLogLevel(eventType, outcome) {
        if (outcome === 'failure' || outcome === 'denied' || outcome === 'error') {
            return 'error';
        }
        
        const warningEvents = [
            this.eventTypes.AUTH_LOGIN_FAILED,
            this.eventTypes.AUTHZ_ACCESS_DENIED,
            this.eventTypes.API_RATE_LIMIT_EXCEEDED
        ];
        
        return warningEvents.includes(eventType) ? 'warn' : 'info';
    }
    
    isSoc2Relevant(eventType) {
        const soc2Events = [
            this.eventTypes.AUTH_LOGIN_SUCCESS,
            this.eventTypes.AUTH_LOGIN_FAILED,
            this.eventTypes.DATA_CREATE,
            this.eventTypes.DATA_UPDATE,
            this.eventTypes.DATA_DELETE,
            this.eventTypes.SECURITY_THREAT_DETECTED,
            this.eventTypes.SYSTEM_CONFIG_CHANGE
        ];
        
        return soc2Events.includes(eventType);
    }
    
    isIso27001Relevant(eventType) {
        const iso27001Events = [
            this.eventTypes.AUTH_LOGIN_FAILED,
            this.eventTypes.AUTHZ_ACCESS_DENIED,
            this.eventTypes.SECURITY_THREAT_DETECTED,
            this.eventTypes.SECURITY_POLICY_VIOLATION,
            this.eventTypes.SECURITY_INCIDENT_CREATED,
            this.eventTypes.SYSTEM_CONFIG_CHANGE,
            this.eventTypes.COMPLIANCE_AUDIT_START,
            this.eventTypes.COMPLIANCE_AUDIT_END
        ];
        
        return iso27001Events.includes(eventType);
    }
    
    isGdprRelevant(eventType) {
        const gdprEvents = [
            this.eventTypes.DATA_READ,
            this.eventTypes.DATA_CREATE,
            this.eventTypes.DATA_UPDATE,
            this.eventTypes.DATA_DELETE,
            this.eventTypes.DATA_EXPORT,
            this.eventTypes.AUTH_PASSWORD_CHANGE
        ];
        
        return gdprEvents.includes(eventType);
    }
    
    getRetentionPeriod(eventType) {
        const longRetentionEvents = [
            this.eventTypes.SECURITY_THREAT_DETECTED,
            this.eventTypes.SECURITY_INCIDENT_CREATED,
            this.eventTypes.COMPLIANCE_AUDIT_START,
            this.eventTypes.COMPLIANCE_AUDIT_END
        ];
        
        return longRetentionEvents.includes(eventType) ? '10y' : '7y';
    }
    
    sanitizeHeaders(headers) {
        const sanitized = { ...headers };
        // Remove sensitive headers
        delete sanitized.authorization;
        delete sanitized.cookie;
        delete sanitized['x-api-key'];
        return sanitized;
    }
    
    /**
     * Get audit statistics for compliance reporting
     */
    async getAuditStats(startDate, endDate) {
        // This would typically query your log storage system
        // For now, return a mock structure
        return {
            total_events: 0,
            events_by_type: {},
            events_by_risk_level: {},
            compliance_events: {
                soc2_events: 0,
                iso27001_events: 0,
                gdpr_events: 0
            },
            period: {
                start: startDate,
                end: endDate
            }
        };
    }
}

module.exports = new AuditLogger();
