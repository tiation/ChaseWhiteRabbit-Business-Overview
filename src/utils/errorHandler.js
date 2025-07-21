/**
 * ChaseWhiteRabbit Error Handler
 * Enterprise-grade error handling middleware
 */

'use strict';

const metricsService = require('../services/metrics');

class ErrorHandler {
    /**
     * Express error handling middleware
     * @param {Error} err - Error object
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Next middleware function
     */
    static handle(err, req, res, next) {
        // Log error details
        console.error('Error occurred:', {
            message: err.message,
            stack: err.stack,
            url: req.url,
            method: req.method,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        });

        // Record error metrics
        metricsService.recordError(err.name || 'UnknownError', err.status || 500);

        // Determine error type and status
        let statusCode = err.status || err.statusCode || 500;
        let errorType = 'InternalServerError';

        if (err.name === 'ValidationError') {
            statusCode = 400;
            errorType = 'ValidationError';
        } else if (err.name === 'UnauthorizedError') {
            statusCode = 401;
            errorType = 'UnauthorizedError';
        } else if (err.name === 'CastError') {
            statusCode = 400;
            errorType = 'CastError';
        }

        // Prepare error response
        const errorResponse = {
            error: {
                type: errorType,
                message: process.env.NODE_ENV === 'production' 
                    ? ErrorHandler.getGenericErrorMessage(statusCode)
                    : err.message,
                status: statusCode,
                timestamp: new Date().toISOString(),
                path: req.url,
                method: req.method
            }
        };

        // Include stack trace in development
        if (process.env.NODE_ENV !== 'production') {
            errorResponse.error.stack = err.stack;
        }

        res.status(statusCode).json(errorResponse);
    }

    /**
     * Get generic error message for production
     * @param {number} statusCode - HTTP status code
     * @returns {string} Generic error message
     */
    static getGenericErrorMessage(statusCode) {
        switch (statusCode) {
            case 400:
                return 'Bad request. Please check your input.';
            case 401:
                return 'Unauthorized. Please check your credentials.';
            case 403:
                return 'Forbidden. You do not have permission to access this resource.';
            case 404:
                return 'Resource not found.';
            case 429:
                return 'Too many requests. Please try again later.';
            case 500:
            default:
                return 'Internal server error. Please try again later.';
        }
    }

    /**
     * Create a custom error
     * @param {string} message - Error message
     * @param {number} status - HTTP status code
     * @param {string} type - Error type
     * @returns {Error} Custom error object
     */
    static createError(message, status = 500, type = 'CustomError') {
        const error = new Error(message);
        error.status = status;
        error.name = type;
        return error;
    }

    /**
     * Async error wrapper for route handlers
     * @param {Function} fn - Async function to wrap
     * @returns {Function} Wrapped function
     */
    static asyncHandler(fn) {
        return (req, res, next) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    }
}

module.exports = ErrorHandler;
