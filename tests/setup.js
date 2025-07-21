/**
 * ChaseWhiteRabbit Test Setup
 * Enterprise-grade test configuration and utilities
 */

'use strict';

// Import testing utilities
require('@testing-library/jest-dom');

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '0'; // Use random port for tests
process.env.LOG_LEVEL = 'error'; // Reduce log noise in tests

// Global test utilities
global.testUtils = {
    // Common test data
    validDiceTypes: ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'],
    
    // Helper functions
    delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
    
    randomDiceType: () => {
        const types = global.testUtils.validDiceTypes;
        return types[Math.floor(Math.random() * types.length)];
    },
    
    mockRollResult: (diceType = 'd20', count = 1, modifier = 0) => ({
        id: 'test-id',
        diceType,
        count,
        modifier,
        rolls: [Math.floor(Math.random() * parseInt(diceType.slice(1))) + 1],
        subtotal: 10,
        total: 10 + modifier,
        timestamp: new Date().toISOString(),
        isCriticalHit: false,
        isCriticalFail: false
    })
};

// Set up test database (if needed)
beforeAll(async () => {
    // Database setup would go here
});

// Clean up after tests
afterAll(async () => {
    // Cleanup would go here
});
