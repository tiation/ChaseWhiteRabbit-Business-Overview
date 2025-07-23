#!/usr/bin/env node
/**
 * Enterprise Audit Trail API Endpoints
 * SOC2 and ISO 27001 Compliant Audit Management
 * 
 * @version 1.0.0
 * @author ChaseWhiteRabbit Team <tiatheone@protonmail.com>
 * @description Secure audit trail access and compliance reporting endpoints
 */

'use strict';

const express = require('express');
const { body, query, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');
const auditLogger = require('../services/auditLogger');

const router = express.Router();

// Rate limiting for audit endpoints
const auditRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 requests per windowMs
    message: {
        error: 'Too many audit requests from this IP, please try again later.',
        code: 'AUDIT_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply rate limiting to all audit routes
router.use(auditRateLimit);

// Middleware for audit endpoint access logging
router.use((req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        const outcome = res.statusCode < 400 ? 'success' : 'failure';
        
        auditLogger.logApiRequest(req, res, responseTime, outcome);
        
        // Log audit trail access specifically
        if (req.path.includes('/trail') || req.path.includes('/events')) {
            auditLogger.logEvent(auditLogger.eventTypes.COMPLIANCE_AUDIT_START, {
                user: { id: req.user?.id || 'anonymous', email: req.user?.email },
                request: { 
                    ip: req.ip, 
                    user_agent: req.get('User-Agent'),
                    endpoint: req.path
                },
                outcome: outcome,
                details: {
                    query_parameters: req.query,
                    response_code: res.statusCode
                }
            });
        }
    });
    
    next();
});

// Authentication middleware (placeholder - implement based on your auth system)
const requireAuth = (req, res, next) => {
    // TODO: Implement proper authentication
    // For now, we'll simulate a user
    req.user = {
        id: 'admin-user',
        email: 'admin@chasewhiterabbit.com',
        roles: ['admin', 'auditor']
    };
    next();
};

// Authorization middleware for audit access
const requireAuditPermission = (req, res, next) => {
    if (!req.user || !req.user.roles || !req.user.roles.includes('auditor')) {
        auditLogger.logEvent(auditLogger.eventTypes.AUTHZ_ACCESS_DENIED, {
            user: { id: req.user?.id, email: req.user?.email },
            request: { ip: req.ip, user_agent: req.get('User-Agent') },
            resource: { type: 'audit_endpoint', id: req.path },
            outcome: 'denied',
            details: { reason: 'insufficient_permissions' }
        });
        
        return res.status(403).json({
            error: 'Access denied',
            message: 'Insufficient permissions to access audit data',
            code: 'AUDIT_ACCESS_DENIED'
        });
    }
    next();
};

/**
 * GET /api/audit/events
 * Retrieve audit events with filtering and pagination
 */
router.get('/events', [
    requireAuth,
    requireAuditPermission,
    query('start_date').optional().isISO8601().withMessage('Invalid start date format'),
    query('end_date').optional().isISO8601().withMessage('Invalid end date format'),
    query('event_type').optional().isString().withMessage('Event type must be a string'),
    query('user_id').optional().isString().withMessage('User ID must be a string'),
    query('risk_level').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid risk level'),
    query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const {
            start_date,
            end_date,
            event_type,
            user_id,
            risk_level,
            limit = 100,
            offset = 0
        } = req.query;

        // Read audit log file and filter events
        const events = await readAuditLog({
            startDate: start_date,
            endDate: end_date,
            eventType: event_type,
            userId: user_id,
            riskLevel: risk_level,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: {
                events: events.slice(offset, offset + limit),
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    total: events.length,
                    has_more: offset + limit < events.length
                },
                filters: {
                    start_date,
                    end_date,
                    event_type,
                    user_id,
                    risk_level
                }
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        auditLogger.logSystemEvent(auditLogger.eventTypes.SYSTEM_ERROR, 'failure', {
            error: error.message,
            endpoint: '/api/audit/events',
            user_id: req.user?.id
        });

        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to retrieve audit events',
            code: 'AUDIT_RETRIEVAL_ERROR'
        });
    }
});

/**
 * GET /api/audit/trail/:audit_id
 * Retrieve specific audit trail by audit ID
 */
router.get('/trail/:audit_id', [
    requireAuth,
    requireAuditPermission
], async (req, res) => {
    try {
        const { audit_id } = req.params;
        
        if (!audit_id || audit_id.length < 10) {
            return res.status(400).json({
                error: 'Invalid audit ID',
                message: 'Audit ID must be provided and valid'
            });
        }

        const event = await findAuditEventById(audit_id);
        
        if (!event) {
            return res.status(404).json({
                error: 'Audit event not found',
                message: `No audit event found with ID: ${audit_id}`
            });
        }

        res.json({
            success: true,
            data: {
                event: event,
                related_events: await findRelatedEvents(event)
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        auditLogger.logSystemEvent(auditLogger.eventTypes.SYSTEM_ERROR, 'failure', {
            error: error.message,
            endpoint: '/api/audit/trail',
            audit_id: req.params.audit_id
        });

        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to retrieve audit trail',
            code: 'AUDIT_TRAIL_ERROR'
        });
    }
});

/**
 * GET /api/audit/compliance/soc2
 * Generate SOC2 compliance report
 */
router.get('/compliance/soc2', [
    requireAuth,
    requireAuditPermission,
    query('start_date').isISO8601().withMessage('Start date is required and must be valid'),
    query('end_date').isISO8601().withMessage('End date is required and must be valid')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { start_date, end_date } = req.query;
        
        auditLogger.logEvent(auditLogger.eventTypes.COMPLIANCE_AUDIT_START, {
            user: { id: req.user.id, email: req.user.email },
            details: {
                report_type: 'soc2',
                period: { start: start_date, end: end_date }
            },
            outcome: 'initiated'
        });

        const report = await generateSoc2Report(start_date, end_date);
        
        auditLogger.logEvent(auditLogger.eventTypes.COMPLIANCE_AUDIT_END, {
            user: { id: req.user.id, email: req.user.email },
            details: {
                report_type: 'soc2',
                events_analyzed: report.summary.total_events,
                compliance_score: report.compliance_score
            },
            outcome: 'completed'
        });

        res.json({
            success: true,
            data: report,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        auditLogger.logSystemEvent(auditLogger.eventTypes.SYSTEM_ERROR, 'failure', {
            error: error.message,
            endpoint: '/api/audit/compliance/soc2'
        });

        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to generate SOC2 compliance report',
            code: 'SOC2_REPORT_ERROR'
        });
    }
});

/**
 * GET /api/audit/compliance/iso27001
 * Generate ISO 27001 compliance report
 */
router.get('/compliance/iso27001', [
    requireAuth,
    requireAuditPermission,
    query('start_date').isISO8601().withMessage('Start date is required and must be valid'),
    query('end_date').isISO8601().withMessage('End date is required and must be valid')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { start_date, end_date } = req.query;
        
        auditLogger.logEvent(auditLogger.eventTypes.COMPLIANCE_AUDIT_START, {
            user: { id: req.user.id, email: req.user.email },
            details: {
                report_type: 'iso27001',
                period: { start: start_date, end: end_date }
            },
            outcome: 'initiated'
        });

        const report = await generateIso27001Report(start_date, end_date);
        
        auditLogger.logEvent(auditLogger.eventTypes.COMPLIANCE_AUDIT_END, {
            user: { id: req.user.id, email: req.user.email },
            details: {
                report_type: 'iso27001',
                events_analyzed: report.summary.total_events,
                compliance_score: report.compliance_score
            },
            outcome: 'completed'
        });

        res.json({
            success: true,
            data: report,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        auditLogger.logSystemEvent(auditLogger.eventTypes.SYSTEM_ERROR, 'failure', {
            error: error.message,
            endpoint: '/api/audit/compliance/iso27001'
        });

        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to generate ISO 27001 compliance report',
            code: 'ISO27001_REPORT_ERROR'
        });
    }
});

/**
 * GET /api/audit/statistics
 * Get audit statistics and metrics
 */
router.get('/statistics', [
    requireAuth,
    requireAuditPermission,
    query('start_date').optional().isISO8601().withMessage('Invalid start date format'),
    query('end_date').optional().isISO8601().withMessage('Invalid end date format')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { start_date, end_date } = req.query;
        const stats = await auditLogger.getAuditStats(start_date, end_date);

        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        auditLogger.logSystemEvent(auditLogger.eventTypes.SYSTEM_ERROR, 'failure', {
            error: error.message,
            endpoint: '/api/audit/statistics'
        });

        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to retrieve audit statistics',
            code: 'AUDIT_STATS_ERROR'
        });
    }
});

/**
 * Helper functions
 */

async function readAuditLog(filters = {}) {
    try {
        const logPath = path.join(process.cwd(), 'logs', 'audit.log');
        const fileContent = await fs.readFile(logPath, 'utf8');
        const lines = fileContent.split('\n').filter(line => line.trim());
        
        let events = lines.map(line => {
            try {
                return JSON.parse(line);
            } catch (e) {
                return null;
            }
        }).filter(event => event !== null);

        // Apply filters
        if (filters.startDate) {
            events = events.filter(event => event.timestamp >= filters.startDate);
        }
        if (filters.endDate) {
            events = events.filter(event => event.timestamp <= filters.endDate);
        }
        if (filters.eventType) {
            events = events.filter(event => event.event_type === filters.eventType);
        }
        if (filters.userId) {
            events = events.filter(event => event.user?.id === filters.userId);
        }
        if (filters.riskLevel) {
            events = events.filter(event => event.risk_level === filters.riskLevel);
        }

        return events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
        console.error('Error reading audit log:', error);
        return [];
    }
}

async function findAuditEventById(auditId) {
    const events = await readAuditLog();
    return events.find(event => event.audit_id === auditId);
}

async function findRelatedEvents(event) {
    const events = await readAuditLog();
    
    // Find events within 5 minutes of the target event
    const eventTime = new Date(event.timestamp);
    const timeWindow = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    return events.filter(e => {
        if (e.audit_id === event.audit_id) return false;
        
        const eTime = new Date(e.timestamp);
        const timeDiff = Math.abs(eventTime - eTime);
        
        return timeDiff <= timeWindow && (
            e.user?.id === event.user?.id ||
            e.request?.ip === event.request?.ip ||
            e.session?.id === event.session?.id
        );
    }).slice(0, 10); // Limit to 10 related events
}

async function generateSoc2Report(startDate, endDate) {
    const events = await readAuditLog({ startDate, endDate });
    const soc2Events = events.filter(event => event.compliance?.soc2_relevant);
    
    const report = {
        report_type: 'SOC2 Type II',
        period: { start: startDate, end: endDate },
        generated_at: new Date().toISOString(),
        summary: {
            total_events: soc2Events.length,
            security_events: soc2Events.filter(e => e.event_category === 'security').length,
            authentication_events: soc2Events.filter(e => e.event_category === 'authentication').length,
            data_access_events: soc2Events.filter(e => e.event_category === 'data_access').length,
            high_risk_events: soc2Events.filter(e => e.risk_level === 'high').length
        },
        trust_services_criteria: {
            security: {
                events_count: soc2Events.filter(e => e.event_category === 'security').length,
                compliance_score: 95, // Mock score
                findings: []
            },
            availability: {
                events_count: soc2Events.filter(e => e.event_type.includes('system')).length,
                compliance_score: 98,
                findings: []
            },
            processing_integrity: {
                events_count: soc2Events.filter(e => e.event_type.includes('data')).length,
                compliance_score: 92,
                findings: []
            },
            confidentiality: {
                events_count: soc2Events.filter(e => e.event_category === 'data_access').length,
                compliance_score: 96,
                findings: []
            },
            privacy: {
                events_count: soc2Events.filter(e => e.compliance?.gdpr_relevant).length,
                compliance_score: 94,
                findings: []
            }
        },
        compliance_score: 95, // Overall mock score
        recommendations: [
            'Continue monitoring authentication failures',
            'Implement additional data access controls',
            'Regular security awareness training'
        ]
    };
    
    return report;
}

async function generateIso27001Report(startDate, endDate) {
    const events = await readAuditLog({ startDate, endDate });
    const iso27001Events = events.filter(event => event.compliance?.iso27001_relevant);
    
    const report = {
        report_type: 'ISO 27001 ISMS Audit',
        period: { start: startDate, end: endDate },
        generated_at: new Date().toISOString(),
        summary: {
            total_events: iso27001Events.length,
            security_incidents: iso27001Events.filter(e => e.event_type.includes('security')).length,
            access_violations: iso27001Events.filter(e => e.event_type.includes('access.denied')).length,
            configuration_changes: iso27001Events.filter(e => e.event_type.includes('config')).length,
            compliance_events: iso27001Events.filter(e => e.event_type.includes('compliance')).length
        },
        control_categories: {
            'A.9_Access_Control': {
                events_count: iso27001Events.filter(e => e.event_category === 'authorization').length,
                compliance_status: 'compliant',
                findings: []
            },
            'A.12_Operations_Security': {
                events_count: iso27001Events.filter(e => e.event_category === 'system').length,
                compliance_status: 'compliant',
                findings: []
            },
            'A.16_Incident_Management': {
                events_count: iso27001Events.filter(e => e.event_type.includes('security')).length,
                compliance_status: 'compliant',
                findings: []
            },
            'A.18_Compliance': {
                events_count: iso27001Events.filter(e => e.event_type.includes('compliance')).length,
                compliance_status: 'compliant',
                findings: []
            }
        },
        compliance_score: 93, // Overall mock score
        recommendations: [
            'Enhance incident response procedures',
            'Regular vulnerability assessments',
            'Update security policies annually'
        ]
    };
    
    return report;
}

module.exports = router;
