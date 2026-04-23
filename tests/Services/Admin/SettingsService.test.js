import { jest } from '@jest/globals';

jest.unstable_mockModule('@/models/Setting.js', () => ({
    default: {
        findOne: jest.fn(),
        create: jest.fn()
    }
}));

jest.unstable_mockModule('@/core/Lib/appConfig.js', () => ({
    clearAppConfigCache: jest.fn()
}));

const { default: SettingsService } = await import('@/services/Admin/SettingsService.js');
const { default: Setting } = await import('@/models/Setting.js');
const { clearAppConfigCache } = await import('@/core/Lib/appConfig.js');

describe('Industry Standard: SettingsService Business Logic Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('[getSettings]', () => {
        it('[Success] should return existing settings', async () => {
            const mockSetting = { _id: 's1', maintenanceMode: false };
            Setting.findOne.mockResolvedValue(mockSetting);

            const result = await SettingsService.getSettings();

            expect(result).toEqual(mockSetting);
        });

        it('[Success] should create new settings if none exist', async () => {
            Setting.findOne.mockResolvedValue(null);
            const mockNewSetting = { _id: 'snew' };
            Setting.create.mockResolvedValue(mockNewSetting);

            const result = await SettingsService.getSettings();

            expect(Setting.create).toHaveBeenCalledWith({});
            expect(result).toEqual(mockNewSetting);
        });
    });

    describe('[updateSettings]', () => {
        it('[Success] should update existing settings and clear cache', async () => {
            const mockSetting = { save: jest.fn() };
            Setting.findOne.mockResolvedValue(mockSetting);

            await SettingsService.updateSettings({ maintenanceMode: true });

            expect(mockSetting.maintenanceMode).toBe(true);
            expect(mockSetting.save).toHaveBeenCalled();
            expect(clearAppConfigCache).toHaveBeenCalled();
        });
    });
});
