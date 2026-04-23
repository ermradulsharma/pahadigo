import { jest } from '@jest/globals';

jest.unstable_mockModule('@/core/Config/db.js', () => ({
    default: jest.fn().mockResolvedValue({})
}));

jest.unstable_mockModule('@/core/Models/Setting.js', () => ({
    default: { findOne: jest.fn() }
}));

const { getAppConfig, clearAppConfigCache } = await import('@/lib/appConfig.js');

describe('Industry Standard: appConfig Core Library', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        clearAppConfigCache();
        process.env.NODE_ENV = 'test';
    });

    it('[Success] should return environment defaults in test mode', async () => {
        process.env.APP_NAME = 'TestApp';
        const config = await getAppConfig();
        expect(config.app.name).toBe('TestApp');
    });

    it('[Success] should fetch from DB if forceReal is true', async () => {
        const { default: Setting } = await import('@/core/Models/Setting.js');
        Setting.findOne.mockResolvedValue({
            toObject: () => ({ app_name: 'DB App Name' })
        });

        const config = await getAppConfig(true);
        expect(config.app.name).toBe('DB App Name');
    });

    it('[Cache] should return cached value on subsequent calls', async () => {
        const { default: Setting } = await import('@/core/Models/Setting.js');
        Setting.findOne.mockResolvedValue({
            toObject: () => ({ app_name: 'Cached Name' })
        });

        await getAppConfig(true);
        const config = await getAppConfig(true);

        expect(Setting.findOne).toHaveBeenCalledTimes(1);
        expect(config.app.name).toBe('Cached Name');
    });
});
