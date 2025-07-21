/**
 * ChaseWhiteRabbit Dice Service Unit Tests
 * Enterprise-grade testing for core gaming functionality
 */

'use strict';

const diceService = require('../../src/services/dice');

describe('Dice Service', () => {
    beforeEach(() => {
        // Reset state before each test
        diceService.clearRollHistory();
    });

    describe('getAvailableDiceTypes', () => {
        it('should return all available dice types', () => {
            const diceTypes = diceService.getAvailableDiceTypes();
            
            expect(diceTypes).toHaveLength(7);
            expect(diceTypes.map(d => d.type)).toEqual(
                expect.arrayContaining(['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'])
            );
        });

        it('should include proper metadata for each die type', () => {
            const diceTypes = diceService.getAvailableDiceTypes();
            
            diceTypes.forEach(die => {
                expect(die).toHaveProperty('type');
                expect(die).toHaveProperty('sides');
                expect(die).toHaveProperty('name');
                expect(die).toHaveProperty('description');
                expect(typeof die.sides).toBe('number');
                expect(die.sides).toBeGreaterThan(0);
            });
        });
    });

    describe('rollDice', () => {
        it('should roll a single die successfully', async () => {
            const result = await diceService.rollDice('d20', 1, 0);
            
            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('diceType', 'd20');
            expect(result).toHaveProperty('count', 1);
            expect(result).toHaveProperty('modifier', 0);
            expect(result).toHaveProperty('rolls');
            expect(result).toHaveProperty('subtotal');
            expect(result).toHaveProperty('total');
            expect(result).toHaveProperty('timestamp');
            
            expect(result.rolls).toHaveLength(1);
            expect(result.rolls[0]).toBeGreaterThanOrEqual(1);
            expect(result.rolls[0]).toBeLessThanOrEqual(20);
            expect(result.total).toBe(result.subtotal + result.modifier);
        });

        it('should handle multiple dice rolls', async () => {
            const result = await diceService.rollDice('d6', 3, 0);
            
            expect(result.count).toBe(3);
            expect(result.rolls).toHaveLength(3);
            expect(result.subtotal).toBe(result.rolls.reduce((sum, roll) => sum + roll, 0));
            
            result.rolls.forEach(roll => {
                expect(roll).toBeGreaterThanOrEqual(1);
                expect(roll).toBeLessThanOrEqual(6);
            });
        });

        it('should apply modifiers correctly', async () => {
            const modifier = 5;
            const result = await diceService.rollDice('d20', 1, modifier);
            
            expect(result.modifier).toBe(modifier);
            expect(result.total).toBe(result.subtotal + modifier);
        });

        it('should detect critical hits', async () => {
            // Mock the random generation to force a 20
            const originalRollSingle = diceService.rollSingle;
            diceService.rollSingle = jest.fn().mockReturnValue(20);
            
            const result = await diceService.rollDice('d20', 1, 0);
            
            expect(result.isCriticalHit).toBe(true);
            expect(result.isCriticalFail).toBe(false);
            
            // Restore original method
            diceService.rollSingle = originalRollSingle;
        });

        it('should detect critical fails', async () => {
            // Mock the random generation to force a 1
            const originalRollSingle = diceService.rollSingle;
            diceService.rollSingle = jest.fn().mockReturnValue(1);
            
            const result = await diceService.rollDice('d20', 1, 0);
            
            expect(result.isCriticalHit).toBe(false);
            expect(result.isCriticalFail).toBe(true);
            
            // Restore original method
            diceService.rollSingle = originalRollSingle;
        });

        it('should validate dice type', async () => {
            await expect(diceService.rollDice('d99', 1, 0))
                .rejects.toThrow('Invalid dice type: d99');
        });

        it('should validate dice count', async () => {
            await expect(diceService.rollDice('d20', 0, 0))
                .rejects.toThrow('Count must be between 1 and 20');
                
            await expect(diceService.rollDice('d20', 21, 0))
                .rejects.toThrow('Count must be between 1 and 20');
        });

        it('should validate modifiers', async () => {
            await expect(diceService.rollDice('d20', 1, -101))
                .rejects.toThrow('Modifier must be between -100 and 100');
                
            await expect(diceService.rollDice('d20', 1, 101))
                .rejects.toThrow('Modifier must be between -100 and 100');
        });
    });

    describe('generateSecureRandom', () => {
        it('should generate numbers within specified range', () => {
            for (let i = 0; i < 100; i++) {
                const result = diceService.generateSecureRandom(1, 20);
                expect(result).toBeGreaterThanOrEqual(1);
                expect(result).toBeLessThanOrEqual(20);
            }
        });

        it('should generate different numbers', () => {
            const results = new Set();
            for (let i = 0; i < 50; i++) {
                results.add(diceService.generateSecureRandom(1, 100));
            }
            expect(results.size).toBeGreaterThan(10); // Should have some variety
        });
    });

    describe('roll history', () => {
        it('should track roll history', async () => {
            expect(diceService.getRollHistory()).toHaveLength(0);
            
            await diceService.rollDice('d20', 1, 0);
            expect(diceService.getRollHistory()).toHaveLength(1);
            
            await diceService.rollDice('d6', 2, 1);
            expect(diceService.getRollHistory()).toHaveLength(2);
        });

        it('should clear roll history', async () => {
            await diceService.rollDice('d20', 1, 0);
            await diceService.rollDice('d6', 1, 0);
            
            expect(diceService.getRollHistory()).toHaveLength(2);
            
            diceService.clearRollHistory();
            expect(diceService.getRollHistory()).toHaveLength(0);
        });

        it('should limit history size', async () => {
            const originalMaxSize = diceService.maxHistorySize;
            diceService.maxHistorySize = 3;
            
            for (let i = 0; i < 5; i++) {
                await diceService.rollDice('d20', 1, 0);
            }
            
            expect(diceService.getRollHistory()).toHaveLength(3);
            
            // Restore original size
            diceService.maxHistorySize = originalMaxSize;
        });
    });

    describe('rolling statistics', () => {
        it('should track rolling statistics', async () => {
            const initialStats = diceService.getRollingStats();
            expect(initialStats.totalRolls).toBe(0);
            
            await diceService.rollDice('d20', 1, 0);
            
            const updatedStats = diceService.getRollingStats();
            expect(updatedStats.totalRolls).toBe(1);
            expect(updatedStats.rollsByType).toHaveProperty('d20');
        });

        it('should calculate averages correctly', async () => {
            // Mock consistent rolls for predictable averages
            const originalRollSingle = diceService.rollSingle;
            diceService.rollSingle = jest.fn().mockReturnValue(10);
            
            await diceService.rollDice('d20', 1, 0);
            await diceService.rollDice('d20', 1, 0);
            
            const stats = diceService.getRollingStats();
            expect(stats.averagesByType.d20).toBe(10);
            
            // Restore original method
            diceService.rollSingle = originalRollSingle;
        });
    });

    describe('dice notation parsing', () => {
        it('should parse standard dice notation', () => {
            const result = diceService.parseDiceNotation('3d6+2');
            
            expect(result.count).toBe(3);
            expect(result.diceType).toBe('d6');
            expect(result.modifier).toBe(2);
        });

        it('should handle notation without count', () => {
            const result = diceService.parseDiceNotation('d20');
            
            expect(result.count).toBe(1);
            expect(result.diceType).toBe('d20');
            expect(result.modifier).toBe(0);
        });

        it('should handle negative modifiers', () => {
            const result = diceService.parseDiceNotation('2d8-1');
            
            expect(result.count).toBe(2);
            expect(result.diceType).toBe('d8');
            expect(result.modifier).toBe(-1);
        });

        it('should reject invalid notation', () => {
            expect(() => diceService.parseDiceNotation('invalid'))
                .toThrow('Invalid dice notation: invalid');
        });
    });

    describe('rollFromNotation', () => {
        it('should roll dice from notation string', async () => {
            const result = await diceService.rollFromNotation('2d6+1');
            
            expect(result.count).toBe(2);
            expect(result.diceType).toBe('d6');
            expect(result.modifier).toBe(1);
            expect(result.rolls).toHaveLength(2);
        });
    });
});
