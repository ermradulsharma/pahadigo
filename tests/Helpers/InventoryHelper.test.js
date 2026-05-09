import { formatInventoryItem, normalizeAvailability, calculateEffectivePrice, determineDayStatus } from '@/core/Helpers/InventoryHelper.js';

describe('InventoryHelper', () => {
    describe('normalizeAvailability', () => {
        test('should normalize homestay availability', () => {
            const item = { availability: { total: 10, available: 8, occupied: 2 } };
            const result = normalizeAvailability(item);
            expect(result.totalUnits).toBe(10);
            expect(result.availableUnits).toBe(8);
            expect(result.bookedUnits).toBe(2);
        });

        test('should normalize transport/fleet availability', () => {
            const item = { availability: { total: 5, available: 3, occupied: 2 } };
            const result = normalizeAvailability(item);
            expect(result.totalUnits).toBe(5);
            expect(result.availableUnits).toBe(3);
            expect(result.bookedUnits).toBe(2);
        });
    });

    describe('calculateEffectivePrice', () => {
        test('should return base price if no overrides', () => {
            expect(calculateEffectivePrice(100)).toBe(100);
        });

        test('should apply price adjustment amount', () => {
            expect(calculateEffectivePrice(100, { priceAdjustmentAmount: 20 })).toBe(120);
        });

        test('should apply price adjustment percent', () => {
            expect(calculateEffectivePrice(100, { priceAdjustmentPercent: 10 })).toBe(110);
        });

        test('should prioritize basePrice override', () => {
            expect(calculateEffectivePrice(100, { basePrice: 150, priceAdjustmentAmount: 20 })).toBe(150);
        });
    });

    describe('determineDayStatus', () => {
        test('should return sold_out if booked >= total', () => {
            expect(determineDayStatus(10, 10, null, true)).toBe('sold_out');
        });

        test('should return manual status if provided', () => {
            expect(determineDayStatus(10, 5, 'maintenance', true)).toBe('maintenance');
        });

        test('should return closed if item is not active', () => {
            expect(determineDayStatus(10, 5, null, false)).toBe('closed');
        });
    });
});
