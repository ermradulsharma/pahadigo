import mongoose from 'mongoose';
import Setting from '../../src/core/Models/Setting.js';

describe('SettingModel Test Suite', () => {
    it('should create a setting document with empty string defaults', async () => {
        const setting = new Setting({});
        const saved = await setting.save();

        expect(saved.smtp_email).toBe('');
        expect(saved.msg91_auth_key).toBe('');
        expect(saved.jwt_secret).toBe('');
        expect(saved.google_client_id).toBe('');
    });

    it('should save provided configuration values', async () => {
        const setting = new Setting({
            app_name: 'PahadiGo Test',
            mongodb_uri: 'mongodb://localhost:27017/test'
        });
        const saved = await setting.save();

        expect(saved.app_name).toBe('PahadiGo Test');
        expect(saved.mongodb_uri).toBe('mongodb://localhost:27017/test');
        expect(saved.jwt_secret).toBe(''); // Verify omitted fields still default
    });
});
