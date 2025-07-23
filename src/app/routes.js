/**
 * ChaseWhiteRabbit API Routes
 * Enterprise-grade REST API endpoints for dice rolling functionality
 * Enhanced with comprehensive audit logging and compliance endpoints
 */

'use strict';

const express = require('express');
const { body, param, validationResult } = require('express-validator');
const diceService = require('../services/dice');
const metricsService = require('../services/metrics');
const auditRoutes = require('../routes/audit');

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }
    next();
};

// API Documentation endpoint
router.get('/', (req, res) => {
    res.json({
        name: 'ChaseWhiteRabbit Dice Rolling API',
        version: '1.0.0',
        description: 'Enterprise-grade D&D dice rolling service',
        endpoints: {
            'GET /api/dice/types': 'Get available dice types',
            'POST /api/dice/roll': 'Roll dice with specified parameters',
            'GET /api/dice/history': 'Get roll history (last 100 rolls)',
            'DELETE /api/dice/history': 'Clear roll history',
            'GET /api/stats': 'Get rolling statistics',
            'GET /api/audit/events': 'Get audit events (requires audit permissions)',
            'GET /api/audit/compliance/soc2': 'Generate SOC2 compliance report',
            'GET /api/audit/compliance/iso27001': 'Generate ISO 27001 compliance report'
        },
        documentation: 'https://chasewhiterabbit.sxc.codes/docs'
    });
});

// Get available dice types
router.get('/dice/types', (req, res) => {
    try {
        const diceTypes = diceService.getAvailableDiceTypes();
        res.json({
            success: true,
            diceTypes,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to get dice types',
            message: error.message
        });
    }
});

// Roll dice endpoint
router.post('/dice/roll', [
    body('diceType')
        .isIn(['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'])
        .withMessage('Invalid dice type'),
    body('count')
        .optional()
        .isInt({ min: 1, max: 20 })
        .withMessage('Count must be between 1 and 20'),
    body('modifier')
        .optional()
        .isInt({ min: -100, max: 100 })
        .withMessage('Modifier must be between -100 and 100')
], handleValidationErrors, async (req, res) => {
    try {
        const { diceType, count = 1, modifier = 0 } = req.body;
        
        // Roll the dice
        const result = await diceService.rollDice(diceType, count, modifier);
        
        // Record metrics
        metricsService.recordDiceRoll(diceType, count, result.total);
        
        res.json({
            success: true,
            result,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        res.status(500).json({
            error: 'Failed to roll dice',
            message: error.message
        });
    }
});

// Get roll history
router.get('/dice/history', (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 100, 1000);
        const history = diceService.getRollHistory(limit);
        
        res.json({
            success: true,
            history,
            count: history.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to get roll history',
            message: error.message
        });
    }
});

// Clear roll history
router.delete('/dice/history', (req, res) => {
    try {
        diceService.clearRollHistory();
        
        res.json({
            success: true,
            message: 'Roll history cleared',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to clear roll history',
            message: error.message
        });
    }
});

// Get rolling statistics
router.get('/stats', (req, res) => {
    try {
        const stats = diceService.getRollingStats();
        
        res.json({
            success: true,
            stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to get statistics',
            message: error.message
        });
    }
});

// Batch roll endpoint for advanced users
router.post('/dice/batch', [
    body('rolls')
        .isArray({ min: 1, max: 10 })
        .withMessage('Rolls must be an array with 1-10 items'),
    body('rolls.*.diceType')
        .isIn(['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'])
        .withMessage('Invalid dice type in batch'),
    body('rolls.*.count')
        .optional()
        .isInt({ min: 1, max: 20 })
        .withMessage('Count must be between 1 and 20'),
], handleValidationErrors, async (req, res) => {
    try {
        const { rolls } = req.body;
        const results = [];
        
        for (const rollConfig of rolls) {
            const { diceType, count = 1, modifier = 0, label } = rollConfig;
            const result = await diceService.rollDice(diceType, count, modifier);
            
            results.push({
                ...result,
                label,
                diceType,
                count,
                modifier
            });
            
            // Record metrics
            metricsService.recordDiceRoll(diceType, count, result.total);
        }
        
        const totalSum = results.reduce((sum, result) => sum + result.total, 0);
        
        res.json({
            success: true,
            results,
            summary: {
                totalRolls: results.length,
                totalSum,
                average: Math.round((totalSum / results.length) * 100) / 100
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        res.status(500).json({
            error: 'Failed to execute batch roll',
            message: error.message
        });
    }
});

// Mount audit routes
router.use('/audit', auditRoutes);

module.exports = router;
