import { jest } from '@jest/globals';

jest.unstable_mockModule('@/core/Services/Admin/DashboardService.js', () => ({
    __esModule: true,
    default: {
        getDashboardStats: jest.fn(),
        getAnalyticsData: jest.fn(),
        getMapAnalyticsData: jest.fn(),
        getSearchAnalytics: jest.fn(),
        getFinancialStats: jest.fn(),
        getSystemHealth: jest.fn()
    }
}));

jest.unstable_mockModule('@/core/Services/Admin/AuditService.js', () => ({
    __esModule: true,
    default: {
        getAuditLogs: jest.fn()
    }
}));

const { default: DashboardController } = await import('@/core/Http/Controllers/Admin/DashboardController.js');
const { default: DashboardService } = await import('@/core/Services/Admin/DashboardService.js');
const { default: AuditService } = await import('@/core/Services/Admin/AuditService.js');
const { HTTP_STATUS } = await import('@/core/Constants/index.js');
const { createMockReq } = await import('../../../Helpers/testUtils.js');

describe('Admin DashboardController Unit Tests', () => {
    let mockReq;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getStats', () => {
        it('should return aggregated platform dashboard stats', async () => {
            mockReq = createMockReq({ user: { role: 'admin' } });
            DashboardService.getDashboardStats.mockResolvedValue({ totalBookings: 150, totalRevenue: 500000 });

            const response = await DashboardController.getStats(mockReq);
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(body.data.stats).toEqual({ totalBookings: 150, totalRevenue: 500000 });
        });
    });

    describe('getAnalytics', () => {
        it('should return analytics for financial type', async () => {
            mockReq = createMockReq({
                user: { role: 'admin' },
                url: 'http://localhost/admin/analytics?type=financial'
            });

            DashboardService.getFinancialStats.mockResolvedValue({ gmv: 1000000, netPayouts: 850000 });

            const response = await DashboardController.getAnalytics(mockReq);
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(body.data.analytics.gmv).toBe(1000000);
        });
    });

    describe('getAuditLogs', () => {
        it('should return paginated audit logs', async () => {
            mockReq = createMockReq({
                user: { role: 'admin' },
                url: 'http://localhost/admin/audit-logs?page=1&limit=20'
            });

            AuditService.getAuditLogs.mockResolvedValue({ logs: [{ action: 'vendor_approved' }], total: 1 });

            const response = await DashboardController.getAuditLogs(mockReq);
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(body.data.logs).toHaveLength(1);
        });
    });
});
