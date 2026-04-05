import { normalizeAvailability, calculateEffectivePrice } from '../../../src/core/Helpers/InventoryHelper.js';

describe('InventoryHelper Test Suite', () => {
    describe('normalizeAvailability', () => {
        it('should normalize Hotel/Homestay availability fields', () => {
            const item = {
                availability: {
                    totalRooms: 10,
                    availableRooms: 8,
                    occupiedRooms: 2
                }
            };
            const result = normalizeAvailability(item);
            expect(result.totalUnits).toBe(10);
            expect(result.availableUnits).toBe(8);
            expect(result.bookedUnits).toBe(2);
        });

        it('should normalize Trekking/Activity slots fields', () => {
            const item = {
                availability: {
                    totalSlots: 50,
                    availableSlots: 45,
                    bookedSlots: 5
                }
            };
            const result = normalizeAvailability(item);
            expect(result.totalUnits).toBe(50);
            expect(result.availableUnits).toBe(45);
            expect(result.bookedUnits).toBe(5);
        });

        it('should normalize Camping tents fields', () => {
            const item = {
                availability: {
                    totalTents: 5,
                    availableTents: 3,
                    occupiedTents: 2
                }
            };
            const result = normalizeAvailability(item);
            expect(result.totalUnits).toBe(5);
            expect(result.availableUnits).toBe(3);
            expect(result.bookedUnits).toBe(2);
        });

        it('should normalize Transport fleet fields', () => {
            const item = {
                fleetAvailability: {
                    totalVehicles: 4,
                    availableVehicles: 3,
                    rentedVehicles: 1
                }
            };
            const result = normalizeAvailability(item);
            expect(result.totalUnits).toBe(4);
            expect(result.availableUnits).toBe(3);
            expect(result.bookedUnits).toBe(1);
        });

        it('should return zeros for empty item', () => {
            const result = normalizeAvailability({});
            expect(result.totalUnits).toBe(0);
            expect(result.availableUnits).toBe(0);
            expect(result.bookedUnits).toBe(0);
        });
    });

    describe('calculateEffectivePrice', () => {
        it('should return base price when no overrides are present', () => {
            expect(calculateEffectivePrice(100)).toBe(100);
        });

        it('should use priceOverride if provided', () => {
            expect(calculateEffectivePrice(100, { basePrice: 150 })).toBe(150);
        });

        it('should apply price adjustment amount', () => {
            expect(calculateEffectivePrice(100, { priceAdjustmentAmount: 20 })).toBe(120);
            expect(calculateEffectivePrice(100, { priceAdjustmentAmount: -20 })).toBe(80);
        });

        it('should apply price adjustment percent', () => {
            expect(calculateEffectivePrice(100, { priceAdjustmentPercent: 10 })).toBe(110);
            expect(calculateEffectivePrice(100, { priceAdjustmentPercent: -10 })).toBe(90);
        });

        it('should combine adjustment amount and percent (amount then percent on the original base)', () => {
            // According to logic: (finalPrice * (parseFloat(overrides.priceAdjustmentPercent) / 100))
            // finalPrice starts as 100 + amount(20) = 120.
            // 120 + (120 * 0.1) = 132.
            expect(calculateEffectivePrice(100, { priceAdjustmentAmount: 20, priceAdjustmentPercent: 10 })).toBe(132);
        });
    });
});
