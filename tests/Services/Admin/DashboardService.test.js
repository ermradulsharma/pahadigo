import { jest } from '@jest/globals';

// Define the mock chainable object
const mockQuery = {
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    // Mongoose queries are thenable
    then: jest.fn(function(resolve, reject) {
        // By default, resolve with an empty array or as previously set
        resolve(this._resolvedValue || []);
    }),
    // Helper to set what the next 'await' should return
    _resolveWith: function(value) {
        this._resolvedValue = value;
        return this;
    }
};

jest.unstable_mockModule('@/models/User.js', () => ({
    default: { countDocuments: jest.fn(), aggregate: jest.fn() }
}));
jest.unstable_mockModule('@/models/Vendor.js', () => ({
    default: { countDocuments: jest.fn(), find: jest.fn(() => mockQuery) }
}));
jest.unstable_mockModule('@/models/Booking.js', () => ({
    default: { 
        countDocuments: jest.fn(), 
        find: jest.fn(() => mockQuery),
        aggregate: jest.fn()
    }
}));
jest.unstable_mockModule('@/models/SearchLog.js', () => ({
    default: { find: jest.fn(() => mockQuery) }
}));
jest.unstable_mockModule('@/models/Package.js', () => ({
    default: { find: jest.fn(() => mockQuery) }
}));
jest.unstable_mockModule('@/models/Category.js', () => ({
    default: { countDocuments: jest.fn() }
}));
jest.unstable_mockModule('@/models/Dispute.js', () => ({
    default: { find: jest.fn(() => mockQuery), countDocuments: jest.fn() }
}));

const { default: DashboardService } = await import('@/services/Admin/DashboardService.js');
const { default: User } = await import('@/models/User.js');
const { default: Booking } = await import('@/models/Booking.js');

describe('Industry Standard: DashboardService Analytics Logic', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockQuery._resolvedValue = []; // Reset default resolution
    });

    it('[Stats] should aggregate system health and counts correctly', async () => {
        User.countDocuments.mockResolvedValue(150);
        const health = await DashboardService.getSystemHealth();
        expect(health.activeUsers).toBe(150);
        expect(health.status).toBe('healthy');
    });

    it('[Financials] should aggregate revenue from aggregate pipeline', async () => {
        Booking.aggregate.mockResolvedValue([{ totalRevenue: 50000, pendingPayouts: 10000, refundsProcessed: 2000 }]);
        const stats = await DashboardService.getFinancialStats();
        expect(stats.totalRevenue).toBe(50000);
        expect(stats.refundsProcessed).toBe(2000);
    });

    it('[Calendar] should query bookings within date range', async () => {
        const mockBooking = { _id: '1', startDate: new Date(), bookingDetails: { category: 'trekking' } };
        mockQuery._resolveWith([mockBooking]);

        const start = new Date('2024-01-01');
        const end = new Date('2024-01-31');
        const events = await DashboardService.getCalendarEvents(start, end);
        
        expect(Array.isArray(events)).toBe(true);
        expect(events[0].type).toBe('booking');
    });
});
