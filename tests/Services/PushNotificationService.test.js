import { jest } from '@jest/globals';
import { PushNotificationService } from '@/core/Services/PushNotificationService.js';
import admin from 'firebase-admin';
import Setting from '@/core/Models/Setting.js';

describe('PushNotificationService', () => {
    let mockMessaging;

    beforeEach(() => {
        jest.clearAllMocks();
        mockMessaging = {
            send: jest.fn(),
            sendEachForMulticast: jest.fn()
        };
        
        // Mock Setting.findOne to return firebase config
        jest.spyOn(Setting, 'findOne').mockResolvedValue({
            firebase_project_id: 'test-project',
            firebase_client_email: 'test@test.com',
            firebase_private_key: 'test-key'
        });

        // Mock firebase-admin
        jest.spyOn(admin, 'messaging').mockReturnValue(mockMessaging);
        jest.spyOn(admin, 'initializeApp').mockImplementation(() => {});
        jest.spyOn(admin.credential, 'cert').mockReturnValue({});
        
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('should send notification to a single device', async () => {
        mockMessaging.send.mockResolvedValue('msg_id_123');
        const token = 'device_token_123';
        const notification = { title: 'Test', body: 'Test body' };

        const result = await PushNotificationService.sendToDevice(token, notification);

        expect(result.success).toBe(true);
        expect(result.messageId).toBe('msg_id_123');
    });
});
