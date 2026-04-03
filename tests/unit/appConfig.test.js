import Setting from '../../src/core/Models/Setting.js';
import { getAppConfig, clearAppConfigCache } from '../../src/core/Lib/appConfig.js';

describe('appConfig', () => {
    beforeEach(async () => {
        await Setting.deleteMany({});
        clearAppConfigCache();
        process.env.DEBUG = 'false';
    });

    it('should return database settings if present', async () => {
        await Setting.create({
            app_name: 'Database App',
            debug_mode: true
        });

        const config = await getAppConfig(true);
        expect(config.app.name).toBe('Database App');
        expect(config.debug_mode).toBe(true);
    });

    it('should fallback to env variables if DB is empty', async () => {
        process.env.APP_NAME = 'Env App';
        const config = await getAppConfig(true);
        expect(config.app.name).toBe('Env App');
    });

    it('should respect false boolean values from DB (no fallback to true env)', async () => {
        process.env.DEBUG = 'true';
        await Setting.create({
            debug_mode: false
        });

        const config = await getAppConfig(true);
        expect(config.debug_mode).toBe(false); // Correctly uses ?? instead of ||
    });

    it('should clear cache and fetch fresh values', async () => {
        await Setting.create({ app_name: 'Version 1' });
        let config = await getAppConfig(true);
        expect(config.app.name).toBe('Version 1');

        // Update DB
        await Setting.updateOne({}, { app_name: 'Version 2' });
        
        // Should still be Version 1 due to cache
        config = await getAppConfig(true);
        expect(config.app.name).toBe('Version 1');

        // Clear cache
        clearAppConfigCache();
        config = await getAppConfig(true);
        expect(config.app.name).toBe('Version 2');
    });
});
