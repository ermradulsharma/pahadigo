import { jest } from '@jest/globals';

const mockMessaging = {
    send: jest.fn(),
    sendEachForMulticast: jest.fn()
};

// Mock firebase helper module
jest.unstable_mockModule('@/core/Lib/firebase.js', () => ({
    getMessaging: jest.fn().mockResolvedValue(mockMessaging),
    initFirebaseAdmin: jest.fn().mockResolvedValue(mockMessaging),
    firebaseAdmin: {}
}));

// Dynamically import PushNotificationService so it uses the mocked module
const { PushNotificationService } = await import('@/core/Services/PushNotificationService.js');

describe('PushNotificationService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
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
        expect(mockMessaging.send).toHaveBeenCalledWith(expect.objectContaining({
            token,
            notification: expect.objectContaining({
                title: 'Test',
                body: 'Test body'
            })
        }));
    });

    test('should return error if getMessaging returns null', async () => {
        const { getMessaging } = await import('@/core/Lib/firebase.js');
        getMessaging.mockResolvedValueOnce(null);

        const result = await PushNotificationService.sendToDevice('token', { title: 'Test', body: 'Body' });
        expect(result.success).toBe(false);
        expect(result.error).toBe('Firebase not initialized');
    });

    test('should handle send error', async () => {
        mockMessaging.send.mockRejectedValueOnce(new Error('FCM error'));

        const result = await PushNotificationService.sendToDevice('token', { title: 'Test', body: 'Body' });
        expect(result.success).toBe(false);
        expect(result.error).toBe('FCM error');
    });

    test('should send notification to multiple devices', async () => {
        mockMessaging.sendEachForMulticast.mockResolvedValue({
            successCount: 2,
            failureCount: 0,
            responses: []
        });
        const tokens = ['token1', 'token2'];
        const notification = { title: 'Multicast', body: 'Multicast body' };

        const result = await PushNotificationService.sendToMultiple(tokens, notification);

        expect(result.success).toBe(true);
        expect(result.response.successCount).toBe(2);
        expect(mockMessaging.sendEachForMulticast).toHaveBeenCalledWith(expect.objectContaining({
            tokens,
            notification: expect.objectContaining({
                title: 'Multicast',
                body: 'Multicast body'
            })
        }));
    });

    test('should send notification to a topic', async () => {
        mockMessaging.send.mockResolvedValue('topic_msg_id');
        const topic = 'all_vendors';
        const notification = { title: 'Topic title', body: 'Topic body' };

        const result = await PushNotificationService.sendToTopic(topic, notification);

        expect(result.success).toBe(true);
        expect(result.messageId).toBe('topic_msg_id');
        expect(mockMessaging.send).toHaveBeenCalledWith(expect.objectContaining({
            topic,
            notification: expect.objectContaining({
                title: 'Topic title',
                body: 'Topic body'
            })
        }));
    });
});
