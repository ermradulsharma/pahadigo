import SettingsController from '../../../src/core/Http/Controllers/SettingsController.js';
import Setting from '../../../src/core/Models/Setting.js';

describe('Settings API Integration', () => {
    // We'll clear the settings collection before each test to ensure a clean state
    beforeEach(async () => {
        await Setting.deleteMany({});
    });

    it('should fetch settings or create default if not exists', async () => {
        const req = {};

        const response = await SettingsController.getSettings(req);
        expect(response.status).toBe(200);
        
        const data = await response.json();
        
        expect(data.data).toBeDefined();
        // Since it's a new DB state, it should have created a default empty one
        
        // Verify it was created in DB
        const count = await Setting.countDocuments();
        expect(count).toBe(1);
    });

    it('should update existing settings', async () => {
        // Create an initial setting
        const initialSetting = await Setting.create({ smtp_email: 'initial@example.com' });

        const req = {
            jsonBody: { smtp_email: 'updated@example.com', app_name: 'PahadiGo Updated' }
        };

        const response = await SettingsController.updateSettings(req);
        expect(response.status).toBe(200);

        const data = await response.json();

        expect(data.data.smtp_email).toBe('updated@example.com');
        expect(data.data.app_name).toBe('PahadiGo Updated');

        // Verify update in DB
        const updatedSetting = await Setting.findById(initialSetting._id);
        expect(updatedSetting.smtp_email).toBe('updated@example.com');
        expect(updatedSetting.app_name).toBe('PahadiGo Updated');
    });

    it('should create settings if updating but no existing setting found', async () => {
        const req = {
            jsonBody: { smtp_email: 'create@example.com' }
        };

        const response = await SettingsController.updateSettings(req);
        expect(response.status).toBe(200);

        const data = await response.json();

        expect(data.data.smtp_email).toBe('create@example.com');

        const count = await Setting.countDocuments();
        expect(count).toBe(1);
    });
});
