import { jest } from '@jest/globals';
import InventoryService from '@/services/General/InventoryService.js';
import { Inventory, Package, Booking } from '@/models/index.js';
import * as InventoryHelper from '@/helpers/InventoryHelper.js';

describe('General InventoryService', () => {
    beforeEach(() => {
        jest.spyOn(Inventory, 'findOne');
        jest.spyOn(Package, 'findOne');
        jest.spyOn(Booking, 'find');
    });
    const vendorId = 'vendor123';
    const itemId = 'item123';
    const serviceType = 'stay';
    const date = new Date('2026-05-01');

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('_getEffectiveDay', () => {
        test('should return effective day data', async () => {
            const mockPkg = { 
                vendor: vendorId,
                stay: [{ _id: itemId, isActive: true, pricing: { price: 100 }, availability: { totalRooms: 10 } }]
            };
            Package.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockPkg) });
            Inventory.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
            Booking.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });

            const result = await InventoryService._getEffectiveDay(vendorId, itemId, serviceType, date);

            expect(result.totalUnits).toBe(10);
            expect(result.status).toBe('available');
            expect(result.pricing.basePrice).toBe(100);
        });

        test('should return null if package or item not found', async () => {
            Package.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
            const result = await InventoryService._getEffectiveDay(vendorId, itemId, serviceType, date);
            expect(result).toBeNull();
        });
    });

    describe('checkAvailabilityRange', () => {
        test('should return available true if all days are available', async () => {
            jest.spyOn(InventoryService, '_getEffectiveDay').mockResolvedValue({
                status: 'available',
                availableUnits: 5
            });

            const result = await InventoryService.checkAvailabilityRange(
                vendorId, itemId, serviceType, '2026-05-01', '2026-05-02', 2
            );

            expect(result.available).toBe(true);
        });

        test('should return available false if any day is sold out', async () => {
            jest.spyOn(InventoryService, '_getEffectiveDay')
                .mockResolvedValueOnce({ status: 'available', availableUnits: 5 })
                .mockResolvedValueOnce({ status: 'sold_out', availableUnits: 0 });

            const result = await InventoryService.checkAvailabilityRange(
                vendorId, itemId, serviceType, '2026-05-01', '2026-05-02', 1
            );

            expect(result.available).toBe(false);
            expect(result.failedDate).toBeDefined();
        });
    });

    describe('reserveSlotsRange', () => {
        test('should succeed if units are available', async () => {
            jest.spyOn(InventoryService, '_getEffectiveDay').mockResolvedValue({
                totalUnits: 10,
                bookedUnits: 2
            });
            Inventory.findOne.mockResolvedValue({ vendorId, itemId });

            const result = await InventoryService.reserveSlotsRange(
                vendorId, itemId, serviceType, '2026-05-01', '2026-05-01', 1
            );

            expect(result).toBe(true);
        });

        test('should throw error if units are insufficient', async () => {
            jest.spyOn(InventoryService, '_getEffectiveDay').mockResolvedValue({
                totalUnits: 10,
                bookedUnits: 9
            });
            Inventory.findOne.mockResolvedValue({ vendorId, itemId });

            await expect(InventoryService.reserveSlotsRange(
                vendorId, itemId, serviceType, '2026-05-01', '2026-05-01', 2
            )).rejects.toThrow('Insufficient units');
        });
    });
});
