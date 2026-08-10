import { jest } from '@jest/globals';

jest.unstable_mockModule('@/models/Setting.js', () => {
    const mockSettingInstance = (data) => ({
        ...data,
        save: jest.fn().mockResolvedValue(true),
        set: jest.fn(function(d) { Object.assign(this, d); }),
        toObject: jest.fn(function() { return this; })
    });
    
    const MockSetting = jest.fn().mockImplementation(mockSettingInstance);
    
    const mockQuery = {
        lean: jest.fn().mockReturnThis(),
        then: jest.fn(function(resolve) {
            resolve(this._resolvedValue || null);
        })
    };
    
    MockSetting.findOne = jest.fn(() => mockQuery);
    MockSetting.create = jest.fn();
    MockSetting._mockQuery = mockQuery;
    
    return { default: MockSetting };
});

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
            Setting._mockQuery._resolvedValue = mockSetting;

            const result = await SettingsService.getSettings();

            expect(result).toEqual(mockSetting);
        });

        it('[Success] should create new settings if none exist', async () => {
            Setting._mockQuery._resolvedValue = null;
            const mockNewSetting = { _id: 'snew', toObject: jest.fn().mockReturnThis() };
            Setting.create.mockResolvedValue(mockNewSetting);

            const result = await SettingsService.getSettings();

            expect(Setting.create).toHaveBeenCalledWith({});
            expect(result).toEqual(mockNewSetting);
        });
    });

    describe('[updateSettings]', () => {
        it('[Success] should update existing settings and clear cache', async () => {
            const mockSetting = { 
                save: jest.fn().mockResolvedValue(true),
                set: jest.fn(function(data) { Object.assign(this, data); }),
                toObject: jest.fn(function() { return this; })
            };
            Setting._mockQuery._resolvedValue = mockSetting;

            await SettingsService.updateSettings({ maintenanceMode: true });

            expect(mockSetting.maintenanceMode).toBe(true);
            expect(mockSetting.save).toHaveBeenCalled();
            expect(clearAppConfigCache).toHaveBeenCalled();
        });

        it('[Success] should create new settings if none exist', async () => {
            Setting._mockQuery._resolvedValue = null;
            
            const result = await SettingsService.updateSettings({ maintenanceMode: true });

            expect(Setting).toHaveBeenCalledWith({ maintenanceMode: true });
            expect(result.maintenanceMode).toBe(true);
            expect(clearAppConfigCache).toHaveBeenCalled();
        });
    });
});
