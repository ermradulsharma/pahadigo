import { normalizeAvailability, calculateEffectivePrice, determineDayStatus } from '@/helpers/InventoryHelper.js';

describe('Industry Standard: Inventory Helper Logic', () => {
    describe('[normalizeAvailability]', () => {
        it('[Success] should normalize homestay availability', () => {
            const item = { availability: { totalRooms: 10, availableRooms: 5, occupiedRooms: 5 } };
            const result = normalizeAvailability(item);
            expect(result.totalUnits).toBe(10);
            expect(result.bookedUnits).toBe(5);
        });

        it('[Success] should normalize transport fleet availability', () => {
            const item = { fleetAvailability: { totalVehicles: 3, availableVehicles: 1, rentedVehicles: 2 } };
            const result = normalizeAvailability(item);
            expect(result.totalUnits).toBe(3);
            expect(result.bookedUnits).toBe(2);
        });
    });

    describe('[calculateEffectivePrice]', () => {
        it('[Direct] should use override basePrice if provided', () => {
            const result = calculateEffectivePrice(100, { basePrice: 150 });
            expect(result).toBe(150);
        });

        it('[Adjustment] should apply amount then percent adjustments', () => {
            // 100 + 20 = 120; 120 + 10% = 132
            const result = calculateEffectivePrice(100, { priceAdjustmentPercent: 10, priceAdjustmentAmount: 20 });
            expect(result).toBe(132);
        });
    });

    describe('[determineDayStatus]', () => {
        it('[Sold Out] should return sold_out if booked >= total', () => {
            const status = determineDayStatus(5, 5, null, true);
            expect(status).toBe('sold_out');
        });

        it('[Closed] should return closed if item is inactive', () => {
            const status = determineDayStatus(10, 0, null, false);
            expect(status).toBe('closed');
        });
    });
});
