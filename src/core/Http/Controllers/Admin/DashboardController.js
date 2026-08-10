import DashboardService from '@/core/Services/Admin/DashboardService.js';
import AuditService from '@/core/Services/Admin/AuditService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import Controller from '../Controller.js';
import { z } from 'zod';
import { validate } from '@/core/Helpers/validation.js';
import AppError from '@/core/Helpers/AppError.js';

const analyticsSchema = z.object({
    type: z.enum(['map', 'calendar', 'search', 'financial', 'health']).optional(),
    period: z.enum(['weekly', 'monthly', 'yearly']).optional().default('monthly'),
    start: z.string().optional(),
    end: z.string().optional()
});

const auditSchema = z.object({
    userId: z.string().optional(),
    adminId: z.string().optional(),
    action: z.string().optional(),
    target: z.string().optional(),
    startDate: z.string().optional(),
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('20')
});

/**
 * DashboardController (Admin Role)
 */
class DashboardController extends Controller {

    // GET /admin/stats
    async getStats(req) {
        try {
            const stats = await DashboardService.getDashboardStats();
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.ADMIN.STATS_FETCHED, { stats });
        } catch (error) {
            if (error instanceof AppError) return this.error(error.statusCode, error.message);
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // GET /admin/analytics
    async getAnalytics(req) {
        try {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost';
            const url = new URL(req.url, baseUrl);
            
            const queryParams = Object.fromEntries(url.searchParams.entries());
            const { success, data, error } = validate(analyticsSchema, queryParams);
            
            if (!success) {
                throw new AppError(error, HTTP_STATUS.BAD_REQUEST);
            }

            const { type, period, start, end } = data;

            let resultData;
            if (type === 'map') {
                resultData = await DashboardService.getMapAnalyticsData();
            } else if (type === 'calendar') {
                resultData = await DashboardService.getCalendarEvents(start, end);
            } else if (type === 'search') {
                resultData = await DashboardService.getSearchAnalytics();
            } else if (type === 'financial') {
                resultData = await DashboardService.getFinancialStats();
            } else if (type === 'health') {
                resultData = await DashboardService.getSystemHealth();
            } else {
                resultData = await DashboardService.getAnalyticsData(period);
            }

            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCHED, { analytics: resultData });
        } catch (error) {
            if (error instanceof AppError) return this.error(error.statusCode, error.message);
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // GET /admin/audit-logs
    async getAuditLogs(req) {
        try {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost';
            const url = new URL(req.url, baseUrl);
            
            const queryParams = Object.fromEntries(url.searchParams.entries());
            const { success, data, error } = validate(auditSchema, queryParams);
            
            if (!success) {
                throw new AppError(error, HTTP_STATUS.BAD_REQUEST);
            }

            const params = {
                userId: data.userId || data.adminId,
                action: data.action,
                target: data.target,
                startDate: data.startDate
            };

            const page = parseInt(data.page);
            const limit = parseInt(data.limit);

            const result = await AuditService.getAuditLogs(params, page, limit);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.ADMIN.AUDIT_LOGS_FETCHED, result);
        } catch (error) {
            if (error instanceof AppError) return this.error(error.statusCode, error.message);
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }
}

const dashboardController = new DashboardController();
export default dashboardController;
