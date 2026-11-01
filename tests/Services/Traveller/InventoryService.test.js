import { jest } from '@jest/globals';
import { createMockModels } from '../../utils/mockHelpers.js';

const createMockQuery = (val) => ({
    lean: jest.fn().mockResolvedValue(val),
    _resolvedValue: val,
    then: jest.fn(function(resolve) { resolve(this._resolvedValue); })
});

const mockModelsObj = createMockModels({
    Inventory: { findOne: jest.fn() },
    Package: { findOne: jest.fn() },
    Booking: { find: jest.fn() }
});

jest.unstable_mockModule('@/core/Models/index.js', () => mockModelsObj);
jest.unstable_mockModule('@/models/index.js', () => mockModelsObj);

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

    it('[Success] _getEffectiveDay defaults when no custom calendar present', async () => {
        const mockPkg = { trekking: [{ _id: 'item1', isActive: true, availableUnits: 10 }] };
        const mockInv = { calendar: [] };

        Inventory.findOne.mockReturnValue(createMockQuery(mockInv));
        Package.findOne.mockReturnValue(createMockQuery(mockPkg));
        Booking.find.mockReturnValue(createMockQuery([]));

        const result = await InventoryService._getEffectiveDay('v1', 'item1', 'trekking', new Date('2024-01-01'));

        expect(result).not.toBeNull();
        expect(result.availableUnits).toBe(10);
    });

    it('[Success] checkAvailabilityRange detects overbooked dates accurately', async () => {
        const mockPkg = { trekking: [{ _id: 'item1', isActive: true, availableUnits: 5 }] };
        const mockInv = { calendar: [] };

        Inventory.findOne.mockReturnValue(createMockQuery(mockInv));
        Package.findOne.mockReturnValue(createMockQuery(mockPkg));
        Booking.find.mockReturnValue(createMockQuery([{ 
            occupancy: { adults: 4, children: 0 },
            startDate: new Date('2023-12-31'), 
            endDate: new Date('2024-01-02'),
            status: 'confirmed'
        }]));

        const date = new Date('2024-01-01');
        const check = await InventoryService.checkAvailabilityRange('v1', 'item1', 'trekking', date, date, 2);

        expect(check.available).toBe(false);
        expect(check.failedDate).toBeDefined();
    });
});
