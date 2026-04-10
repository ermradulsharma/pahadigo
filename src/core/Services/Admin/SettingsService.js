import Setting from '@/models/Setting.js';
import { clearAppConfigCache } from '@/lib/appConfig.js';

/**
 * SettingsService (Admin Role)
 * Administration of global application configurations and system-level parameters.
 */
class SettingsService {
    async getSettings() {
        let setting = await Setting.findOne();
        if (!setting) setting = await Setting.create({});
        return setting;
    }

    async updateSettings(data) {
        let setting = await Setting.findOne();
        if (!setting) {
            setting = new Setting(data);
        } else {
            Object.assign(setting, data);
        }
        
        await setting.save();
        
        // Ensure cache is refreshed
        try {
            clearAppConfigCache();
        } catch (e) {
            console.warn("[SettingsService] Failed to clear config cache:", e.message);
        }
        
        return setting;
    }
}

export default new SettingsService();
