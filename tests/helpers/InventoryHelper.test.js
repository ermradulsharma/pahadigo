import { 
    formatDateKey, 
    calculateEffectivePrice, 
    normalizeAvailability, 
    determineDayStatus 
} from '../../src/core/Helpers/InventoryHelper.js';

describe('InventoryHelper', () => {
    describe('formatDateKey()', () => {
        it('should format a date object to YYYY-MM-DD string', () => {
            const date = new Date('2024-05-10T15:30:00Z');
            expect(formatDateKey(date)).toBe('2024-05-10');
        });

        it('should handle string dates correctly', () => {
            expect(formatDateKey('2024-05-10')).toBe('2024-05-10');
        });
    });

    describe('calculateEffectivePrice()', () => {
        it('should use basePrice override if provided', () => {
            const result = calculateEffectivePrice(1000, { basePrice: 1500 });
            expect(result).toBe(1500);
        });

        it('should apply priceAdjustmentAmount to basePrice', () => {
            const result = calculateEffectivePrice(1000, { priceAdjustmentAmount: 200 });
            expect(result).toBe(1200);
        });

        it('should apply priceAdjustmentPercent to basePrice', () => {
            const result = calculateEffectivePrice(1000, { priceAdjustmentPercent: 10 });
            expect(result).toBe(1100);
        });

        it('should round to 2 decimal places', () => {
            const result = calculateEffectivePrice(100, { priceAdjustmentPercent: 10.555 });
            expect(result).toBe(110.56);
        });
    });

    describe('normalizeAvailability()', () => {
        it('should extract availability from homestay/trekking schema', () => {
            const item = { 
                availability: { totalRooms: 5, availableRooms: 3, occupiedRooms: 2 } 
            };
            const result = normalizeAvailability(item);
            expect(result.totalUnits).toBe(5);
            expect(result.availableUnits).toBe(3);
            expect(result.bookedUnits).toBe(2);
        });

        it('should extract fleetAvailability from transport schema', () => {
            const item = { 
                fleetAvailability: { totalVehicles: 10, availableVehicles: 8, rentedVehicles: 2 } 
            };
            const result = normalizeAvailability(item);
            expect(result.totalUnits).toBe(10);
            expect(result.availableUnits).toBe(8);
            expect(result.bookedUnits).toBe(2);
        });

        it('should handle trek slots correctly', () => {
            const item = { 
                availability: { totalSlots: 50, bookedSlots: 10 } 
            };
            const result = normalizeAvailability(item);
            expect(result.totalUnits).toBe(50);
            expect(result.bookedUnits).toBe(10);
        });
    });

    describe('determineDayStatus()', () => {
        it('should return manualStatus if provided', () => {
            expect(determineDayStatus(10, 0, 'closed', true)).toBe('closed');
        });

        it('should return sold_out if bookedUnits >= totalUnits', () => {
            expect(determineDayStatus(10, 10, null, true)).toBe('sold_out');
        });

        it('should return available if active and units remain', () => {
            expect(determineDayStatus(10, 5, null, true)).toBe('available');
        });

        it('should return closed if item is not active', () => {
            expect(determineDayStatus(10, 0, null, false)).toBe('closed');
        });
    });
});
