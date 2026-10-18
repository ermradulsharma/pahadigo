import { jest } from '@jest/globals';

const { roundToDecimal, toFixed2, formatINR } = await import('@/core/Helpers/mathUtils.js');

describe('mathUtils Helper Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('roundToDecimal', () => {
        it('should round standard floating numbers to 2 decimal places by default', () => {
            expect(roundToDecimal(12.345)).toBe(12.35);
            expect(roundToDecimal(12.344)).toBe(12.34);
        });

        it('should round numbers to custom decimal places', () => {
            expect(roundToDecimal(12.34567, 3)).toBe(12.346);
            expect(roundToDecimal(12.34567, 1)).toBe(12.3);
            expect(roundToDecimal(12.34567, 0)).toBe(12);
        });

        it('should handle numeric string inputs gracefully', () => {
            expect(roundToDecimal('99.999')).toBe(100);
            expect(roundToDecimal('15.555', 2)).toBe(15.56);
        });

        it('should return 0 when input is non-numeric or NaN', () => {
            expect(roundToDecimal('invalid')).toBe(0);
            expect(roundToDecimal(null)).toBe(0);
            expect(roundToDecimal(undefined)).toBe(0);
        });
    });

    describe('toFixed2', () => {
        it('should correctly round input to 2 decimal places', () => {
            expect(toFixed2(1499.994)).toBe(1499.99);
            expect(toFixed2(1499.996)).toBe(1500);
            expect(toFixed2('250.456')).toBe(250.46);
        });
    });

    describe('formatINR', () => {
        it('should format numbers according to the Indian Rupee currency system', () => {
            const formatted = formatINR(250000);
            expect(formatted).toContain('2,50,000');
            expect(formatted).toMatch(/₹|INR/);
        });

        it('should format numbers without symbol when symbol option is false', () => {
            const formatted = formatINR(1500, { symbol: false });
            expect(formatted).toBe('1,500.00');
        });

        it('should handle invalid or zero values safely', () => {
            expect(formatINR(0)).toMatch(/0\.00/);
            expect(formatINR('invalid')).toMatch(/0\.00/);
        });
    });
});

