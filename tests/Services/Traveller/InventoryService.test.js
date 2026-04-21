import { jest } from '@jest/globals';

const createMockQuery = (val) => ({
    lean: jest.fn().mockReturnThis(),
    _resolvedValue: val,
    then: jest.fn(function(resolve) { resolve(this._resolvedValue); })
});

jest.unstable_mockModule('@/models/index.js', () => ({
    Inventory: { findOne: jest.fn() },
    Package: { findOne: jest.fn() },
    Booking: { find: jest.fn() }
}));

jest.unstable_mockModule('@/helpers/InventoryHelper.js', () => ({
    formatDateKey: (d) => new Date(d).toISOString().split('T')[0],
    normalizeAvailability: (item) => ({ totalUnits: item.availableUnits || 10 }),
    determineDayStatus: (total, booked, customStatus, active) => {
        if (!active) return 'inactive';
        return (total - booked > 0) ? 'available' : 'sold_out';
    },
    calculateEffectivePrice: (p) => p
}));

const { default: InventoryService } = await import('@/services/Traveller/InventoryService.js');
const { Inventory, Package, Booking } = await import('@/models/index.js');

describe('Industry Standard: InventoryService Business Logic', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('[Internal] should calculate effective day data correctly', async () => {
        const mockPkg = { trekking: [{ _id: 'item1', isActive: true, availableUnits: 10 }] };
        const mockInv = { calendar: [] };

        Inventory.findOne.mockReturnValue(createMockQuery(mockInv));
        Package.findOne.mockReturnValue(createMockQuery(mockPkg));
        Booking.find.mockReturnValue(createMockQuery([]));

        const result = await InventoryService._getEffectiveDay('v1', 'item1', 'trekking', new Date('2024-01-01'));

        expect(result).not.toBeNull();
        expect(result.availableUnits).toBe(10);
    });

    it('[Availability] should fail if units required exceed available', async () => {
        const mockPkg = { trekking: [{ _id: 'item1', isActive: true, availableUnits: 5 }] };
        const mockInv = { calendar: [] };

        Inventory.findOne.mockReturnValue(createMockQuery(mockInv));
        Package.findOne.mockReturnValue(createMockQuery(mockPkg));
        Booking.find.mockReturnValue(createMockQuery([{ totalTravellers: 4 }]));

        const date = new Date('2024-01-01');
        const check = await InventoryService.checkAvailabilityRange('v1', 'item1', 'trekking', date, date, 2);

        expect(check.available).toBe(false);
        expect(check.reason).toContain('Sold out');
    });
});
