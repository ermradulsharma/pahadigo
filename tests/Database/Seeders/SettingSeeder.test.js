import { jest } from '@jest/globals';

jest.unstable_mockModule('@/core/Models/Setting.js', () => ({
    default: {
        countDocuments: jest.fn(),
        create: jest.fn()
    }
}));

jest.unstable_mockModule('@/core/Lib/appConfig.js', () => ({
    getAppConfig: jest.fn().mockResolvedValue({
        smtp: {}, msg91: {}, push_notification: {}, razorpay: {},
        google: {}, facebook: {}, apple: {}, app: {}
    })
}));

const { default: seedSettings } = await import('@/database/Seeders/SettingSeeder.js');
const { default: Setting } = await import('@/core/Models/Setting.js');

describe('Industry Standard: SettingSeeder Logic', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('[Success] should seed settings if none exist', async () => {
        Setting.countDocuments.mockResolvedValue(0);
        Setting.create.mockResolvedValue({ _id: 's1' });

        const result = await seedSettings();

        expect(Setting.create).toHaveBeenCalled();
        expect(result._id).toBe('s1');
    });

    it('[Success] should skip seeding if settings exist', async () => {
        Setting.countDocuments.mockResolvedValue(1);

        const result = await seedSettings();

        expect(Setting.create).not.toHaveBeenCalled();
        expect(result.message).toBe('Settings already exist');
    });
});
