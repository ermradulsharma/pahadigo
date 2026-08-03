import DashboardService from '@/core/Services/Admin/DashboardService.js';
import AuditService from '@/core/Services/Admin/AuditService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import Controller from '../Controller.js';

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
            console.error('[DashboardController.getStats] Error:', error);
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // GET /admin/analytics
    async getAnalytics(req) {
        try {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
            const url = new URL(req.url, baseUrl);
            const type = url.searchParams.get('type');
            const period = url.searchParams.get('period') || 'monthly';

            let data;
            if (type === 'map') {
                data = await DashboardService.getMapAnalyticsData();
            } else if (type === 'calendar') {
                const start = url.searchParams.get('start');
                const end = url.searchParams.get('end');
                data = await DashboardService.getCalendarEvents(start, end);
            } else if (type === 'search') {
                data = await DashboardService.getSearchAnalytics();
            } else if (type === 'financial') {
                data = await DashboardService.getFinancialStats();
            } else if (type === 'health') {
                data = await DashboardService.getSystemHealth();
            } else {
                data = await DashboardService.getAnalyticsData(period);
            }

            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCHED, { analytics: data });
        } catch (error) {
            console.error('[DashboardController.getAnalytics] Error:', error);
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // GET /admin/audit-logs
    async getAuditLogs(req) {
        try {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
            const url = new URL(req.url, baseUrl);
            const params = {
                userId: url.searchParams.get('userId') || url.searchParams.get('adminId'),
                action: url.searchParams.get('action'),
                target: url.searchParams.get('target'),
                startDate: url.searchParams.get('startDate')
            };

            const page = parseInt(url.searchParams.get('page') || '1');
            const limit = parseInt(url.searchParams.get('limit') || '20');

            const result = await AuditService.getAuditLogs(params, page, limit);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.ADMIN.AUDIT_LOGS_FETCHED, result);
        } catch (error) {
            console.error('[DashboardController.getAuditLogs] Error:', error);
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }
}

const dashboardController = new DashboardController();
export default dashboardController;
