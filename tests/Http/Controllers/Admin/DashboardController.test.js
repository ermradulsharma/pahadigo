import { jest } from '@jest/globals';
import DashboardController from '@/core/Http/Controllers/Admin/DashboardController.js';
import DashboardService from '@/core/Services/Admin/DashboardService.js';
import AuditService from '@/core/Services/Admin/AuditService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import { createMockReq } from '../../../Helpers/testUtils.js';

describe('Admin DashboardController', () => {
    let mockReq;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('getStats', () => {
        test('should return dashboard stats', async () => {
            const mockStats = { bookings: 10, revenue: 1000 };
            mockReq = createMockReq({ user: { role: 'admin' } });
            
            jest.spyOn(DashboardService, 'getDashboardStats').mockResolvedValue(mockStats);

            const response = await DashboardController.getStats(mockReq);
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(body.message).toBe(RESPONSE_MESSAGES.ADMIN.STATS_FETCHED);
            expect(body.data.stats).toEqual(mockStats);
        });
    });

    describe('getAnalytics', () => {
        test('should return map analytics when type is map', async () => {
            const mockData = { points: [] };
            mockReq = createMockReq({ 
                user: { role: 'admin' },
                url: 'http://localhost/admin/analytics?type=map'
            });

            jest.spyOn(DashboardService, 'getMapAnalyticsData').mockResolvedValue(mockData);

            const response = await DashboardController.getAnalytics(mockReq);
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(body.data.analytics).toEqual(mockData);
        });

        test('should return financial stats when type is financial', async () => {
            const mockData = { total: 100 };
            mockReq = createMockReq({ 
                user: { role: 'admin' },
                url: 'http://localhost/admin/analytics?type=financial'
            });

            jest.spyOn(DashboardService, 'getFinancialStats').mockResolvedValue(mockData);

            const response = await DashboardController.getAnalytics(mockReq);
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(body.data.analytics).toEqual(mockData);
        });
    });

    describe('getAuditLogs', () => {
        test('should return paginated audit logs', async () => {
            const mockResult = { logs: [], total: 0 };
            mockReq = createMockReq({ 
                user: { role: 'admin' },
                url: 'http://localhost/admin/audit-logs?page=2&limit=10'
            });

            const spy = jest.spyOn(AuditService, 'getAuditLogs').mockResolvedValue(mockResult);

            const response = await DashboardController.getAuditLogs(mockReq);
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(body.data).toEqual(mockResult);
            expect(spy).toHaveBeenCalledWith(expect.anything(), 2, 10);
        });
    });
});
