import { jest } from '@jest/globals';

const mockFindOne = jest.fn();
const mockFind = jest.fn();
const mockLean = jest.fn();
const mockSession = jest.fn();

const chainableMock = (data) => {
    const mock = {};
    mock.session = jest.fn().mockReturnValue(mock);
    mock.lean = jest.fn().mockResolvedValue(data);
    return mock;
};

jest.unstable_mockModule('@/core/Models/index.js', () => ({
    Inventory: { findOne: mockFindOne },
    Package: { findOne: mockFindOne },
    Booking: { find: mockFind }
}));

jest.unstable_mockModule('@/core/Helpers/InventoryHelper.js', () => ({
    formatDateKey: jest.fn((date) => {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }),
    normalizeAvailability: jest.fn(() => ({ totalUnits: 10 })),
    determineDayStatus: jest.fn(() => 'available'),
    calculateEffectivePrice: jest.fn(() => 100)
}));

const { getEffectiveDay } = await import('@/core/Services/Shared/InventoryCore.js');
const InventoryHelper = await import('@/core/Helpers/InventoryHelper.js');

describe('InventoryCore', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getEffectiveDay', () => {
        it('should return null if package not found', async () => {
            mockFindOne.mockReturnValueOnce(chainableMock(null)); // Inventory
            mockFind.mockReturnValueOnce(chainableMock([]));      // Bookings
            mockFindOne.mockReturnValueOnce(chainableMock(null)); // Package
            
            const result = await getEffectiveDay('v1', 'i1', 'hotel', new Date());
            expect(result).toBeNull();
        });

        it('should return null if item not found in package', async () => {
            mockFindOne.mockReturnValueOnce(chainableMock(null)); // Inventory
            mockFind.mockReturnValueOnce(chainableMock([]));      // Bookings
            mockFindOne.mockReturnValueOnce(chainableMock({ hotel: [{ _id: 'other' }] })); // Package
            
            const result = await getEffectiveDay('v1', 'i1', 'hotel', new Date());
            expect(result).toBeNull();
        });

        it('should calculate effective day for hotel with bookings', async () => {
            const mockDate = new Date('2023-01-01');
            const mockInv = { calendar: [{ date: mockDate, bookedUnits: 2 }] };
            const mockBookings = [{ occupancy: { units: 2 } }, { occupancy: { units: 3 } }];
            const mockPkg = { hotel: [{ _id: 'i1', isActive: true, pricing: { sellingPrice: 90, childPrice: 10, extraBedPrice: 20 } }] };

            mockFindOne.mockReturnValueOnce(chainableMock(mockInv)); // Inventory
            mockFind.mockReturnValueOnce(chainableMock(mockBookings)); // Bookings
            mockFindOne.mockReturnValueOnce(chainableMock(mockPkg)); // Package

            const result = await getEffectiveDay('v1', 'i1', 'hotel', mockDate);
            
            expect(result.totalUnits).toBe(10);
            expect(result.bookedUnits).toBe(5); // 2 + 3 from bookings, which is > 2 from customDay
            expect(result.availableUnits).toBe(5);
            expect(result.pricing.basePrice).toBe(100);
            expect(result.pricing.childPrice).toBe(10);
            expect(result.pricing.extraBedPrice).toBe(20);
        });

        it('should calculate effective day for customTrip (exclusive)', async () => {
            const mockDate = new Date('2023-01-01');
            const mockBookings = [{ _id: 'b1' }]; // has live booking
            const mockPkg = { customTrip: [{ _id: 'i1', isActive: true, pricing: { sellingPrice: 500 } }] };

            mockFindOne.mockReturnValueOnce(chainableMock(null)); // Inventory
            mockFind.mockReturnValueOnce(chainableMock(mockBookings)); // Bookings
            mockFindOne.mockReturnValueOnce(chainableMock(mockPkg)); // Package

            const result = await getEffectiveDay('v1', 'i1', 'customTrip', mockDate);
            
            expect(result.totalUnits).toBe(10);
            expect(result.bookedUnits).toBe(10); // exclusive blocks all units
            expect(result.availableUnits).toBe(0);
        });

        it('should handle activities counting slots correctly', async () => {
            const mockDate = new Date('2023-01-01');
            const mockBookings = [{ occupancy: { adults: 2, children: 1 } }, { occupancy: { adults: 1 } }];
            const mockPkg = { activity: [{ _id: 'i1', isActive: true }] };

            mockFindOne.mockReturnValueOnce(chainableMock(null)); // Inventory
            mockFind.mockReturnValueOnce(chainableMock(mockBookings)); // Bookings
            mockFindOne.mockReturnValueOnce(chainableMock(mockPkg)); // Package

            const result = await getEffectiveDay('v1', 'i1', 'activity', mockDate);
            
            expect(result.bookedUnits).toBe(4); // 2+1 + 1
            expect(result.availableUnits).toBe(6);
        });
    });
});
