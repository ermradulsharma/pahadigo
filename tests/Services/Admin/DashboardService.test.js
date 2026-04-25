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
    default: { countDocuments: jest.fn(), aggregate: jest.fn(), find: jest.fn(() => mockQuery) }
}));
jest.unstable_mockModule('@/models/Vendor.js', () => ({
    default: { countDocuments: jest.fn(), find: jest.fn(() => mockQuery), aggregate: jest.fn() }
}));
jest.unstable_mockModule('@/models/Booking.js', () => ({
    default: { 
        countDocuments: jest.fn(), 
        find: jest.fn(() => mockQuery),
        aggregate: jest.fn()
    }
}));
jest.unstable_mockModule('@/models/SearchLog.js', () => ({
    default: { find: jest.fn(() => mockQuery), countDocuments: jest.fn(), aggregate: jest.fn() }
}));
jest.unstable_mockModule('@/models/Package.js', () => ({
    default: { find: jest.fn(() => mockQuery), countDocuments: jest.fn(), aggregate: jest.fn() }
}));
jest.unstable_mockModule('@/models/Category.js', () => ({
    default: { countDocuments: jest.fn(), find: jest.fn(() => mockQuery), aggregate: jest.fn() }
}));
jest.unstable_mockModule('@/models/Dispute.js', () => ({
    default: { find: jest.fn(() => mockQuery), countDocuments: jest.fn(), aggregate: jest.fn() }
}));
jest.unstable_mockModule('@/models/AuditLog.js', () => ({
    default: { find: jest.fn(() => mockQuery), countDocuments: jest.fn() }
}));

const { default: DashboardService } = await import('@/services/Admin/DashboardService.js');
const { default: User } = await import('@/models/User.js');
const { default: Booking } = await import('@/models/Booking.js');
const { default: Vendor } = await import('@/models/Vendor.js');
const { default: Package } = await import('@/models/Package.js');
const { default: Category } = await import('@/models/Category.js');
const { default: Dispute } = await import('@/models/Dispute.js');
const { default: SearchLog } = await import('@/models/SearchLog.js');
const { default: AuditLog } = await import('@/models/AuditLog.js');
import mongoose from 'mongoose';

// Mock DB Stats globally
if (!mongoose.connection.db) {
    mongoose.connection.db = {};
}
mongoose.connection.db.stats = jest.fn().mockResolvedValue({ dataSize: 1024, storageSize: 2048 });

describe('Industry Standard: DashboardService Analytics Logic', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockQuery._resolvedValue = []; // Reset default resolution
        if (mongoose.connection.db) {
            mongoose.connection.db.stats = jest.fn().mockResolvedValue({ dataSize: 1024, storageSize: 2048 });
        }
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

    it('[DashboardStats] should aggregate all counts and recent data', async () => {
        User.countDocuments.mockResolvedValue(100);
        Vendor.countDocuments.mockResolvedValue(50);
        Category.countDocuments.mockResolvedValue(10);
        Booking.countDocuments.mockResolvedValue(200);
        Booking.aggregate.mockResolvedValue([{ total: 100000 }]);
        Package.aggregate.mockResolvedValue([{ count: 25 }]);
        
        // New metrics mocks
        Vendor.aggregate.mockResolvedValue([{ _id: 'Dehradun', count: 10 }]);
        Booking.find.mockReturnValue({
            populate: jest.fn().mockReturnThis(),
            sort: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue([])
        });
        AuditLog.find.mockReturnValue({
            populate: jest.fn().mockReturnThis(),
            sort: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue([])
        });
        Dispute.find.mockReturnValue({
            populate: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue([])
        });

        const stats = await DashboardService.getDashboardStats();

        expect(stats.users).toBe(100);
        expect(stats.totalVendors).toBe(50);
        expect(stats.packages).toBe(25);
        expect(stats.revenue).toBe(100000);
        expect(stats.topTerritories).toBeDefined();
        expect(stats.departures).toBeDefined();
        expect(stats.systemHealth).toBeDefined();
        expect(stats.systemHealth.storageLoad).toBe(50); // (1024/2048)*100
        
        expect(Vendor.find).toHaveBeenCalled();
        expect(Booking.find).toHaveBeenCalled();
        expect(AuditLog.find).toHaveBeenCalled();
    });

    it('[Analytics] should aggregate data by period', async () => {
        Booking.aggregate.mockResolvedValueOnce([{ _id: '2024-01-01', revenue: 5000 }]) // revenueData
            .mockResolvedValueOnce([{ _id: 'confirmed', value: 10 }]) // bookingStatus
            .mockResolvedValueOnce([{ _id: 'vendor1', totalRevenue: 10000, bookings: 5 }]); // topVendors
        User.aggregate.mockResolvedValue([{ _id: '2024-01-01', travellers: 2, vendors: 1 }]);
        Vendor.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([{ _id: 'vendor1', businessName: 'Test Vendor' }]) });

        const data = await DashboardService.getAnalyticsData('monthly');

        expect(data.revenueData).toBeDefined();
        expect(data.bookingStatus[0].name).toBe('CONFIRMED');
        expect(data.userGrowth).toBeDefined();
        expect(data.topVendors[0].name).toBe('Test Vendor');
    });

    it('[MapAnalytics] should get user distribution', async () => {
        User.aggregate.mockResolvedValue([{ _id: 'Uttarakhand', count: 50 }]);
        const data = await DashboardService.getMapAnalyticsData();
        expect(data.userDistribution[0]._id).toBe('Uttarakhand');
    });

    it('[Calendar] should query bookings within date range', async () => {
        const mockBooking = { _id: '1', startDate: new Date(), bookingDetails: { category: 'trekking' } };
        Booking.find.mockReturnValue({
            populate: jest.fn().mockReturnThis(),
            then: jest.fn(resolve => resolve([mockBooking]))
        });

        const start = new Date('2024-01-01');
        const end = new Date('2024-01-31');
        const events = await DashboardService.getCalendarEvents(start, end);
        
        expect(Array.isArray(events)).toBe(true);
        expect(events[0].type).toBe('booking');
    });

    it('[SearchAnalytics] should fetch top and zero result searches', async () => {
        mockQuery._resolveWith([{ query: 'trekking', count: 10 }]);
        const data = await DashboardService.getSearchAnalytics();
        expect(data.topSearches.length).toBe(1);
        expect(data.zeroResultSearches).toBeDefined();
    });
});
