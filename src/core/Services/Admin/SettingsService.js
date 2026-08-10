import Setting from '@/core/Models/Setting.js';
import { clearAppConfigCache } from '@/core/Lib/appConfig.js';
import AppError from '@/core/Helpers/AppError.js';

/**
 * SettingsService (Admin Role)
 * Administration of global application configurations and system-level parameters.
 */
class SettingsService {
  async getSettings() {
    let setting = await Setting.findOne().lean();
    if (!setting) {
      const newSetting = await Setting.create({});
      setting = newSetting.toObject();
    }
    return setting;
  }

  async updateSettings(data) {
    let setting = await Setting.findOne();
    if (!setting) {
      setting = new Setting(data);
    } else {
      setting.set(data);
    }

    await setting.save();

    // Ensure cache is refreshed
    try {
      clearAppConfigCache();
    } catch (e) {
      // Log failure but don't fail request
    }

    return setting.toObject();
  }
}

export default new SettingsService();
