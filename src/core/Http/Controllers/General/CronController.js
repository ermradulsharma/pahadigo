import Controller from '@/core/Http/Controllers/Controller.js';
import CronService from '@/core/Services/CronService.js';
import { getAppConfig } from '@/core/Lib/appConfig.js';
import { HTTP_STATUS } from '@/core/Constants/index.js';
import { getLogger } from '@/core/Lib/logger.js';

/**
 * CronController - Handles automated system maintenance and cron trigger requests.
 */
class CronController extends Controller {

  /**
   * Execute scheduled cron job based on job parameter
   * GET /api/cron?job=<job_name>
   */
  async handleCron(req) {
    try {
      const authHeader = req.headers.get('authorization');
      const config = await getAppConfig();

      if (authHeader !== `Bearer ${config.secrets?.cron_secret}`) {
        return this.error(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized cron trigger');
      }

      const job = req.query?.job || new URL(req.url).searchParams.get('job');
      let result = null;

      switch (job) {
        case 'dailyBookings':
          result = await CronService.autoCompleteBookings();
          break;
        case 'expireBookings':
          result = await CronService.autoExpireBookings();
          break;
        case 'resolveDisputes':
          result = await CronService.autoResolveDisputes();
          break;
        case 'cleanupLogs':
          result = await CronService.cleanupLogs();
          break;
        case 'all':
          result = {
            completed: await CronService.autoCompleteBookings(),
            expired: await CronService.autoExpireBookings(),
            resolved: await CronService.autoResolveDisputes(),
            cleaned: await CronService.cleanupLogs()
          };
          break;
        default:
          return this.error(HTTP_STATUS.BAD_REQUEST, 'Invalid or missing cron job specified');
      }

      return this.success(HTTP_STATUS.OK, `Cron job '${job}' executed successfully`, result);
    } catch (error) {
      getLogger().error({ err: error, requestId: req.requestId }, '[CronController] Exception');
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Internal Server Error during cron execution');
    }
  }
}

export default new CronController();
