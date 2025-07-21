/**
 * ChaseWhiteRabbit Dice Service
 * Core dice rolling functionality with enterprise-grade reliability
 * 
 * @version 1.0.0
 * @description Handles D&D dice rolling with history tracking and statistics
 */

'use strict';

const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

class DiceService {
    constructor() {
        this.rollHistory = [];
        this.statistics = {
            totalRolls: 0,
            rollsByType: {},
            averagesByType: {},
            criticalHits: 0,
            criticalFails: 0
        };
        
        // Maximum history size to prevent memory issues
        this.maxHistorySize = parseInt(process.env.DICE_ROLL_HISTORY_LIMIT) || 1000;
    }

    /**
     * Get available dice types
     * @returns {Array} Array of available dice configurations
     */
    getAvailableDiceTypes() {
        return [
            { type: 'd4', sides: 4, name: 'Four-sided die', description: 'Tetrahedron die commonly used for damage rolls' },
            { type: 'd6', sides: 6, name: 'Six-sided die', description: 'Standard cube die used in many games' },
            { type: 'd8', sides: 8, name: 'Eight-sided die', description: 'Octahedral die for weapon damage' },
            { type: 'd10', sides: 10, name: 'Ten-sided die', description: 'Pentagonal trapezohedron for percentile rolls' },
            { type: 'd12', sides: 12, name: 'Twelve-sided die', description: 'Dodecahedron die for high damage weapons' },
            { type: 'd20', sides: 20, name: 'Twenty-sided die', description: 'Icosahedral die for ability checks and attacks' },
            { type: 'd100', sides: 100, name: 'Percentile die', description: 'Two d10s for percentage-based rolls' }
        ];
    }

    /**
     * Generate cryptographically secure random number
     * @param {number} min - Minimum value (inclusive)
     * @param {number} max - Maximum value (inclusive)
     * @returns {number} Secure random number
     */
    generateSecureRandom(min, max) {
        const range = max - min + 1;
        const bytesNeeded = Math.ceil(Math.log2(range) / 8);
        const maxValue = Math.pow(256, bytesNeeded);
        const threshold = maxValue - (maxValue % range);
        
        let randomBytes;
        do {
            randomBytes = crypto.randomBytes(bytesNeeded);
            let randomValue = 0;
            for (let i = 0; i < bytesNeeded; i++) {
                randomValue = randomValue * 256 + randomBytes[i];
            }
            
            if (randomValue < threshold) {
                return min + (randomValue % range);
            }
        } while (true);
    }

    /**
     * Roll a single die
     * @param {string} diceType - Type of die (d4, d6, d8, d10, d12, d20, d100)
     * @returns {number} Roll result
     */
    rollSingle(diceType) {
        const dieConfig = this.getAvailableDiceTypes().find(d => d.type === diceType);
        if (!dieConfig) {
            throw new Error(`Invalid dice type: ${diceType}`);
        }
        
        return this.generateSecureRandom(1, dieConfig.sides);
    }

    /**
     * Roll multiple dice with optional modifier
     * @param {string} diceType - Type of die
     * @param {number} count - Number of dice to roll (1-20)
     * @param {number} modifier - Modifier to add to total (+/- 100)
     * @returns {Object} Roll result with details
     */
    async rollDice(diceType, count = 1, modifier = 0) {
        // Validate inputs
        if (!diceType || typeof diceType !== 'string') {
            throw new Error('Dice type is required and must be a string');
        }
        
        if (count < 1 || count > 20) {
            throw new Error('Count must be between 1 and 20');
        }
        
        if (modifier < -100 || modifier > 100) {
            throw new Error('Modifier must be between -100 and 100');
        }

        const dieConfig = this.getAvailableDiceTypes().find(d => d.type === diceType);
        if (!dieConfig) {
            throw new Error(`Invalid dice type: ${diceType}`);
        }

        // Perform the rolls
        const rolls = [];
        for (let i = 0; i < count; i++) {
            rolls.push(this.rollSingle(diceType));
        }

        const subtotal = rolls.reduce((sum, roll) => sum + roll, 0);
        const total = subtotal + modifier;

        // Create roll result
        const result = {
            id: uuidv4(),
            diceType,
            sides: dieConfig.sides,
            count,
            modifier,
            rolls,
            subtotal,
            total,
            timestamp: new Date().toISOString(),
            isCriticalHit: diceType === 'd20' && rolls.length === 1 && rolls[0] === 20,
            isCriticalFail: diceType === 'd20' && rolls.length === 1 && rolls[0] === 1
        };

        // Update statistics
        this.updateStatistics(result);

        // Add to history
        this.addToHistory(result);

        return result;
    }

    /**
     * Update rolling statistics
     * @param {Object} result - Roll result
     */
    updateStatistics(result) {
        this.statistics.totalRolls++;
        
        if (!this.statistics.rollsByType[result.diceType]) {
            this.statistics.rollsByType[result.diceType] = {
                count: 0,
                totalValue: 0,
                rolls: []
            };
        }
        
        this.statistics.rollsByType[result.diceType].count++;
        this.statistics.rollsByType[result.diceType].totalValue += result.total;
        this.statistics.rollsByType[result.diceType].rolls.push(result.total);
        
        // Update averages
        this.statistics.averagesByType[result.diceType] = 
            this.statistics.rollsByType[result.diceType].totalValue / 
            this.statistics.rollsByType[result.diceType].count;

        // Track critical hits and fails
        if (result.isCriticalHit) {
            this.statistics.criticalHits++;
        }
        if (result.isCriticalFail) {
            this.statistics.criticalFails++;
        }
    }

    /**
     * Add result to roll history
     * @param {Object} result - Roll result
     */
    addToHistory(result) {
        this.rollHistory.unshift(result);
        
        // Trim history if it exceeds maximum size
        if (this.rollHistory.length > this.maxHistorySize) {
            this.rollHistory = this.rollHistory.slice(0, this.maxHistorySize);
        }
    }

    /**
     * Get roll history
     * @param {number} limit - Maximum number of rolls to return
     * @returns {Array} Array of roll results
     */
    getRollHistory(limit = 100) {
        return this.rollHistory.slice(0, Math.min(limit, this.rollHistory.length));
    }

    /**
     * Clear roll history
     */
    clearRollHistory() {
        this.rollHistory = [];
    }

    /**
     * Get rolling statistics
     * @returns {Object} Statistics object
     */
    getRollingStats() {
        const stats = {
            ...this.statistics,
            historySize: this.rollHistory.length,
            maxHistorySize: this.maxHistorySize
        };

        // Calculate additional statistics
        if (stats.totalRolls > 0) {
            stats.criticalHitRate = (stats.criticalHits / stats.totalRolls) * 100;
            stats.criticalFailRate = (stats.criticalFails / stats.totalRolls) * 100;
        }

        // Add distribution data for each dice type
        for (const [diceType, data] of Object.entries(stats.rollsByType)) {
            const rolls = data.rolls;
            if (rolls.length > 0) {
                rolls.sort((a, b) => a - b);
                stats.rollsByType[diceType].median = rolls[Math.floor(rolls.length / 2)];
                stats.rollsByType[diceType].min = Math.min(...rolls);
                stats.rollsByType[diceType].max = Math.max(...rolls);
            }
        }

        return stats;
    }

    /**
     * Parse dice notation (e.g., "3d6+2")
     * @param {string} notation - Dice notation
     * @returns {Object} Parsed dice configuration
     */
    parseDiceNotation(notation) {
        const regex = /^(\d+)?d(\d+)([+-]\d+)?$/i;
        const match = notation.match(regex);
        
        if (!match) {
            throw new Error(`Invalid dice notation: ${notation}`);
        }
        
        const count = parseInt(match[1]) || 1;
        const sides = parseInt(match[2]);
        const modifier = match[3] ? parseInt(match[3]) : 0;
        
        // Validate parsed values
        if (count < 1 || count > 20) {
            throw new Error('Count must be between 1 and 20');
        }
        
        if (![4, 6, 8, 10, 12, 20, 100].includes(sides)) {
            throw new Error(`Unsupported die type: d${sides}`);
        }
        
        if (modifier < -100 || modifier > 100) {
            throw new Error('Modifier must be between -100 and 100');
        }
        
        return {
            count,
            diceType: `d${sides}`,
            modifier
        };
    }

    /**
     * Roll dice using standard notation
     * @param {string} notation - Dice notation (e.g., "3d6+2")
     * @returns {Object} Roll result
     */
    async rollFromNotation(notation) {
        const parsed = this.parseDiceNotation(notation);
        return await this.rollDice(parsed.diceType, parsed.count, parsed.modifier);
    }
}

// Create singleton instance
const diceService = new DiceService();

module.exports = diceService;
