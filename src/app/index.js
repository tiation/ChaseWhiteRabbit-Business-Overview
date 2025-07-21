#!/usr/bin/env node
/**
 * ChaseWhiteRabbit Main Application Entry Point
 * Enterprise-grade Express.js server with comprehensive middleware stack
 * 
 * @version 1.0.0
 * @author ChaseWhiteRabbit Team <tiatheone@protonmail.com>
 * @description Digital transformation initiative for modernizing legacy gaming applications
 */

'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createLogger, format, transports } = require('winston');
const promClient = require('prom-client');
require('dotenv').config();

// Import application modules
const routes = require('./routes');
const metricsService = require('../services/metrics');
const healthService = require('../services/health');
const errorHandler = require('../utils/errorHandler');
const requestLogger = require('../utils/requestLogger');

// Configuration
const config = {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    appName: process.env.APP_NAME || 'ChaseWhiteRabbit',
    corsOrigins: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'],
    rateLimit: {
        windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000, // 15 minutes
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
    }
};

// Logger configuration
const logger = createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json()
    ),
    defaultMeta: { service: config.appName },
    transports: [
        new transports.File({ filename: 'logs/error.log', level: 'error' }),
        new transports.File({ filename: 'logs/combined.log' }),
    ],
});

// Add console transport in development
if (config.nodeEnv !== 'production') {
    logger.add(new transports.Console({
        format: format.combine(
            format.colorize(),
            format.simple()
        )
    }));
}

// Initialize Express application
const app = express();

// Trust proxy for accurate client IP addresses
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'"],
            connectSrc: ["'self'"],
            mediaSrc: ["'self'"],
            objectSrc: ["'none'"],
            childSrc: ["'self'"],
            frameAncestors: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"]
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// CORS configuration
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (config.corsOrigins.indexOf(origin) !== -1 || config.corsOrigins.includes('*')) {
            return callback(null, true);
        } else {
            return callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(config.rateLimit.windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(limiter);

// Compression middleware
app.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    }
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger.middleware);

// Static file serving
app.use('/assets', express.static('assets', {
    maxAge: config.nodeEnv === 'production' ? '1y' : 0,
    etag: true,
    lastModified: true
}));

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
    try {
        res.set('Content-Type', promClient.register.contentType);
        const metrics = await promClient.register.metrics();
        res.send(metrics);
    } catch (error) {
        logger.error('Error generating metrics:', error);
        res.status(500).send('Error generating metrics');
    }
});

// Health check endpoints
app.get('/health', healthService.healthCheck);
app.get('/health/ready', healthService.readinessCheck);
app.get('/health/live', healthService.livenessCheck);

// API routes
app.use('/api', routes);

// Serve main application (dice roller interface)
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>ChaseWhiteRabbit - D&D Dice Roller</title>
            <link rel="stylesheet" href="/assets/styles/main.css">
            <meta name="description" content="Fast, reliable D&D dice roller - part of ChaseWhiteRabbit digital transformation initiative">
            <meta name="keywords" content="dnd, dice, roller, dungeons and dragons, tabletop gaming">
        </head>
        <body>
            <header>
                <h1>🐰 ChaseWhiteRabbit Dice Roller</h1>
                <p>Enterprise-grade dice rolling for D&D adventures</p>
            </header>
            
            <main>
                <div class="dice-container">
                    <div class="dice-selector">
                        <button class="dice-btn" data-dice="d4">d4</button>
                        <button class="dice-btn" data-dice="d6">d6</button>
                        <button class="dice-btn" data-dice="d8">d8</button>
                        <button class="dice-btn" data-dice="d10">d10</button>
                        <button class="dice-btn" data-dice="d12">d12</button>
                        <button class="dice-btn" data-dice="d20">d20</button>
                    </div>
                    
                    <div class="roll-interface">
                        <input type="number" id="dice-count" min="1" max="20" value="1" placeholder="Number of dice">
                        <input type="number" id="modifier" placeholder="Modifier (+/-)">
                        <button id="roll-btn" class="roll-button">Roll Dice</button>
                    </div>
                    
                    <div id="result" class="result-container">
                        <p>Click a die and roll to get started!</p>
                    </div>
                    
                    <div id="history" class="history-container">
                        <h3>Roll History</h3>
                        <ul id="roll-history"></ul>
                        <button id="clear-history">Clear History</button>
                    </div>
                </div>
            </main>
            
            <footer>
                <p>⚡ Powered by ChaseWhiteRabbit Digital Transformation Initiative</p>
                <p>🎲 Built for the D&D community with enterprise reliability</p>
            </footer>
            
            <script src="/assets/scripts/main.js"></script>
        </body>
        </html>
    `);
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        message: `The requested route ${req.originalUrl} does not exist`,
        timestamp: new Date().toISOString(),
        path: req.originalUrl
    });
});

// Error handling middleware
app.use(errorHandler.handle);

// Graceful shutdown handling
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

let server;

function gracefulShutdown(signal) {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    
    if (server) {
        server.close((err) => {
            if (err) {
                logger.error('Error during server shutdown:', err);
                process.exit(1);
            }
            
            logger.info('Server closed successfully');
            process.exit(0);
        });
        
        // Force close after 10 seconds
        setTimeout(() => {
            logger.error('Forced shutdown after timeout');
            process.exit(1);
        }, 10000);
    } else {
        process.exit(0);
    }
}

// Start server
function startServer() {
    try {
        server = app.listen(config.port, () => {
            logger.info(`🐰 ChaseWhiteRabbit server started successfully`);
            logger.info(`🌟 Environment: ${config.nodeEnv}`);
            logger.info(`🚀 Server running on port ${config.port}`);
            logger.info(`🎯 Health check available at: http://localhost:${config.port}/health`);
            logger.info(`📊 Metrics available at: http://localhost:${config.port}/metrics`);
            
            // Initialize metrics collection
            metricsService.init();
            
            if (config.nodeEnv === 'development') {
                logger.info(`🎮 Visit http://localhost:${config.port} to start rolling dice!`);
            }
        });
        
        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                logger.error(`Port ${config.port} is already in use`);
            } else {
                logger.error('Server error:', error);
            }
            process.exit(1);
        });
        
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Start the application
if (require.main === module) {
    startServer();
}

module.exports = app;
