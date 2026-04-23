import { jest } from '@jest/globals';

const mockInventoryInstance = {
    calendar: [],
    save: jest.fn().mockImplementation(function() { return Promise.resolve(this); }),
    lastSyncAt: null
};

function MockInventory(data) {
    Object.assign(this, mockInventoryInstance, data);
}
MockInventory.findOne = jest.fn();
MockInventory.prototype.save = mockInventoryInstance.save;

const mockQuery = { lean: jest.fn() };

jest.unstable_mockModule('@/models/index.js', () => ({
    Inventory: MockInventory,
    Package: { findOne: jest.fn(() => mockQuery) },
    Booking: { find: jest.fn(() => mockQuery) }
}));

const { default: InventoryService } = await import('@/services/Vendor/InventoryService.js');
const { Inventory, Package, Booking } = await import('@/models/index.js');

describe('Industry Standard: Vendor InventoryService Logic', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockInventoryInstance.calendar = [];
    });

    describe('[update]', () => {
        it('[Success] should update existing inventory', async () => {
            const vendorId = 'v1';
            const itemId = 'i1';
            const serviceType = 'trekking';
            const existingInv = new MockInventory({ vendorId, itemId, calendar: [] });
            Inventory.findOne.mockResolvedValue(existingInv);

            const updates = [{ date: new Date('2024-01-01'), totalUnits: 10 }];
            const result = await InventoryService.update(vendorId, itemId, serviceType, updates);

            expect(result.calendar).toHaveLength(1);
            expect(result.calendar[0].totalUnits).toBe(10);
            expect(existingInv.save).toHaveBeenCalled();
        });
    });

    describe('[initialize]', () => {
        it('[Success] should initialize inventory for 30 days', async () => {
            const vendorId = 'v1';
            const itemId = 'i1';
            const mockPackage = {
                trekking: [{ _id: 'i1', availability: { totalRooms: 5 } }]
            };
            mockQuery.lean.mockResolvedValue(mockPackage);
            Inventory.findOne.mockResolvedValue(null);

            const result = await InventoryService.initialize(vendorId, itemId, 'trekking', 30);

            expect(result.calendar).toHaveLength(30);
            expect(result.calendar[0].totalUnits).toBe(5);
        });
    });
});
