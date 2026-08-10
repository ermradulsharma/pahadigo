import SettingsService from '@/core/Services/Admin/SettingsService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import Controller from '@/core/Controllers/Controller.js';
import { z } from 'zod';
import { validate } from '@/core/Helpers/validation.js';
import AppError from '@/core/Helpers/AppError.js';

const settingsSchema = z.record(z.any());

/**
 * SettingsController (Admin Role)
 * Platform-wide configurations, system parameters, and global flags.
 */
class SettingsController extends Controller {

  // GET /admin/settings
  async getSettings(req) {
    try {
      const setting = await SettingsService.getSettings();
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCHED, setting);
    } catch (error) {
      if (error instanceof AppError) return this.error(error.statusCode, error.message);
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // POST /admin/settings
  async updateSettings(req) {
    try {
      const { success, data, error } = validate(settingsSchema, req.payload || {});
      if (!success) throw new AppError(error, HTTP_STATUS.BAD_REQUEST);

      const setting = await SettingsService.updateSettings(data);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.UPDATED, setting);
    } catch (error) {
      if (error instanceof AppError) return this.error(error.statusCode, error.message);
      return this.error(HTTP_STATUS.BAD_REQUEST, error.message || RESPONSE_MESSAGES.ERROR.BAD_REQUEST);
    }
  }
}

const settingsController = new SettingsController();
export default settingsController;
