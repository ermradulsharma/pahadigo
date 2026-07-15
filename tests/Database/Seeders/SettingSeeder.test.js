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
        google: {}, facebook: {}, apple: {}, app: {},
        firebase: { project_id: 'p1', client_email: 'c1', private_key: 'k1' },
        tax: { gst: 5, service_tax: 5 },
        cloudinary: { url: 'c1' },
        secrets: { social_pass: 's1', other_account_pass: 'o1', master_otp: 'm1' },
        redis: { upstash_url: '', upstash_token: '', upstash_tcp_url: '', standard_url: '' }
    })
}));

const { default: seedSettings } = await import('@/core/Database/Seeders/SettingSeeder.js');
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
