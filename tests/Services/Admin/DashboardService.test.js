import { jest } from '@jest/globals';
import os from 'os';

jest.unstable_mockModule('mongoose', () => ({
    default: {
        connection: {
            db: {
                stats: jest.fn()
            }
        }
    }
}));

const mockCount = jest.fn();
const mockAggregate = jest.fn();
const mockFind = jest.fn();
const mockPopulate = jest.fn();
const mockSort = jest.fn();
const mockLimit = jest.fn();
const mockSelect = jest.fn();
const mockLean = jest.fn();

const chainableMock = () => {
    const mock = {
        populate: mockPopulate,
        sort: mockSort,
        limit: mockLimit,
        select: mockSelect,
        lean: mockLean
    };
    mockPopulate.mockReturnValue(mock);
    mockSort.mockReturnValue(mock);
    mockLimit.mockReturnValue(mock);
    mockSelect.mockReturnValue(mock);
    return mock;
};

jest.unstable_mockModule('@/core/Models/User.js', () => ({
    default: { countDocuments: mockCount, aggregate: mockAggregate, find: mockFind }
}));
jest.unstable_mockModule('@/core/Models/Vendor.js', () => ({
    default: { countDocuments: mockCount, aggregate: mockAggregate, find: mockFind }
}));
jest.unstable_mockModule('@/core/Models/Booking.js', () => ({
    default: { countDocuments: mockCount, aggregate: mockAggregate, find: mockFind }
}));
jest.unstable_mockModule('@/core/Models/Package.js', () => ({
    default: { aggregate: mockAggregate }
}));
jest.unstable_mockModule('@/core/Models/Category.js', () => ({
    default: { countDocuments: mockCount }
}));
jest.unstable_mockModule('@/core/Models/Dispute.js', () => ({
    default: { find: mockFind }
}));
jest.unstable_mockModule('@/core/Models/SearchLog.js', () => ({
    default: { find: mockFind }
}));
jest.unstable_mockModule('@/core/Models/AuditLog.js', () => ({
    default: { find: mockFind }
}));

jest.unstable_mockModule('@/core/Helpers/dateUtils.js', () => ({
    getStartDateByPeriod: jest.fn(() => new Date('2023-01-01'))
}));

jest.unstable_mockModule('@/core/Constants/index.js', () => ({
    STATUS: { ACTIVE: 'active' },
    USER_ROLES: { TRAVELLER: 'traveller' }
}));
jest.unstable_mockModule('@/core/Constants/categories.js', () => ({
    SCHEMA_KEYS: { HOTEL: 'hotel' }
}));
jest.unstable_mockModule('@/core/Services/CacheService.js', () => ({
    default: { get: jest.fn(), set: jest.fn() }
}));
jest.unstable_mockModule('@/core/Helpers/AppError.js', () => ({
    default: class AppError extends Error {}
}));

const { default: DashboardService } = await import('@/core/Services/Admin/DashboardService.js');
const { default: CacheService } = await import('@/core/Services/CacheService.js');
const mongoose = (await import('mongoose')).default;

describe('DashboardService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockFind.mockReturnValue(chainableMock());
        mockLean.mockResolvedValue([]);
    });

    describe('getSystemHealth', () => {
        it('should return system health metrics', async () => {
            mongoose.connection.db.stats.mockResolvedValue({ collections: 5, dataSize: 100, storageSize: 200, objects: 50 });
            mockCount.mockResolvedValue(10);
            
            const result = await DashboardService.getSystemHealth();
            expect(result.status).toBe('healthy');
            expect(result.database.collections).toBe(5);
            expect(result.activeUsers).toBe(10);
        });
        
        it('should handle db stats error gracefully', async () => {
            mongoose.connection.db.stats.mockRejectedValue(new Error('DB Error'));
            const result = await DashboardService.getSystemHealth();
            expect(result.database.collections).toBe(0);
        });
    });

    describe('getDashboardStats', () => {
        it('should return cached data if available', async () => {
            CacheService.get.mockResolvedValue({ cached: true });
            const result = await DashboardService.getDashboardStats();
            expect(result.cached).toBe(true);
        });

        it('should fetch and cache dashboard stats', async () => {
            CacheService.get.mockResolvedValue(null);
            mockCount.mockResolvedValue(5);
            mockAggregate.mockImplementation((pipeline) => {
                if (pipeline[0].$match?.paymentStatus) return Promise.resolve([{ total: 5000 }]);
                if (pipeline[0].$project) return Promise.resolve([{ count: 10 }]); // Packages
                if (pipeline[0].$match?.isApproved) return Promise.resolve([{ _id: 'Delhi', count: 5 }]); // Territories
                return Promise.resolve([]);
            });
            mongoose.connection.db.stats.mockResolvedValue({ dataSize: 10, storageSize: 20 });
            mockLean.mockResolvedValueOnce([{ user: { name: 'Test' }, item: { title: 'Trip' }, startDate: new Date() }]); // Departures
            mockLean.mockResolvedValueOnce([{ userId: { name: 'Admin' }, action: 'UPDATE', target: 'USER', createdAt: new Date() }]); // Audit logs
            mockLean.mockResolvedValueOnce([]); // recentBookings
            mockLean.mockResolvedValueOnce([]); // recentVendors
            mockLean.mockResolvedValueOnce([]); // disputes

            const result = await DashboardService.getDashboardStats();
            expect(result.revenue).toBe(5000);
            expect(result.packages).toBe(10);
            expect(result.topTerritories[0].name).toBe('Delhi');
            expect(CacheService.set).toHaveBeenCalled();
        });
    });

    describe('getFinancialStats', () => {
        it('should return financial stats', async () => {
            mockAggregate.mockResolvedValue([{ totalRevenue: 1000, pendingPayouts: 200, refundsProcessed: 50 }]);
            const result = await DashboardService.getFinancialStats();
            expect(result.totalRevenue).toBe(1000);
        });

        it('should return default if no stats', async () => {
            mockAggregate.mockResolvedValue([]);
            const result = await DashboardService.getFinancialStats();
            expect(result.totalRevenue).toBe(0);
        });
    });

    describe('getAnalyticsData', () => {
        it('should return analytics data and fill gaps', async () => {
            mockAggregate.mockImplementation((pipeline) => {
                if (pipeline[1]?.$group?._id === "$vendor") return Promise.resolve([{ _id: 'v1', totalRevenue: 500, bookings: 5 }]); // top vendors
                if (pipeline[0].$match?.paymentStatus) return Promise.resolve([{ date: '2023-01-05', revenue: 100 }]); // revenue
                if (pipeline[0].$group?._id === "$status") return Promise.resolve([{ _id: 'confirmed', value: 10 }]); // bookings
                if (pipeline[0].$match?.role) return Promise.resolve([{ _id: '2023-01-05', travellers: 5, vendors: 2 }]); // users
                return Promise.resolve([]);
            });
            mockLean.mockResolvedValue([{ _id: 'v1', businessName: 'Vendor 1' }]); // vendor names

            const result = await DashboardService.getAnalyticsData('monthly');
            expect(result.revenueData.length).toBeGreaterThan(0);
            expect(result.topVendors[0].name).toBe('Vendor 1');
            expect(result.topVendors[0].revenue).toBe(500);
        });
    });

    describe('getMapAnalyticsData', () => {
        it('should return user distribution', async () => {
            mockAggregate.mockResolvedValue([{ _id: 'Delhi', count: 10 }]);
            const result = await DashboardService.getMapAnalyticsData();
            expect(result.userDistribution[0].count).toBe(10);
        });
    });

    describe('getCalendarEvents', () => {
        it('should return calendar events', async () => {
            mockLean.mockResolvedValue([
                { _id: 'b1', bookingDetails: { category: 'Hotel' }, startDate: new Date(), endDate: new Date(), user: { name: 'User' } }
            ]);
            const result = await DashboardService.getCalendarEvents(new Date(), new Date());
            expect(result[0].title).toBe('Hotel');
            expect(result[0].type).toBe('booking');
        });
    });

    describe('getSearchAnalytics', () => {
        it('should return search analytics', async () => {
            mockLean.mockResolvedValue([{ query: 'Delhi', count: 5 }]);
            const result = await DashboardService.getSearchAnalytics();
            expect(result.topSearches[0].query).toBe('Delhi');
        });
    });
});
