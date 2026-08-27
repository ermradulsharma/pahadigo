import { jest } from '@jest/globals';

const mockSend = jest.fn();
const mockSendEachForMulticast = jest.fn();

jest.unstable_mockModule('@/core/Lib/firebase.js', () => ({
    getMessaging: jest.fn().mockResolvedValue({
        send: mockSend,
        sendEachForMulticast: mockSendEachForMulticast
    })
}));

jest.unstable_mockModule('@/core/Lib/logger.js', () => ({
    getLogger: jest.fn().mockReturnValue({
        warn: jest.fn(),
        error: jest.fn(),
        info: jest.fn(),
        debug: jest.fn()
    })
}));

const { PushNotificationService } = await import('@/core/Services/PushNotificationService.js');

describe('PushNotificationService Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('sendToDevice', () => {
        it('should send FCM notification to single device successfully', async () => {
            mockSend.mockResolvedValue('projects/pahadigo/messages/msg-1');

            const token = 'fcm_token_123';
            const notification = { title: 'Booking Confirmed', body: 'Your trek to Kedarkantha is confirmed!' };
            const data = { bookingId: 'b123' };

            const res = await PushNotificationService.sendToDevice(token, notification, data);

            expect(res.success).toBe(true);
            expect(res.messageId).toBe('projects/pahadigo/messages/msg-1');
            expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
                token,
                notification: expect.objectContaining({ title: 'Booking Confirmed' }),
                data: expect.objectContaining({ bookingId: 'b123', click_action: 'FLUTTER_NOTIFICATION_CLICK' })
            }));
        });

        it('should handle invalid token error gracefully', async () => {
            const err = new Error('The registration token is invalid');
            err.code = 'messaging/invalid-registration-token';
            mockSend.mockRejectedValue(err);

            const res = await PushNotificationService.sendToDevice('bad_token', { title: 'Test', body: 'Test' });

            expect(res.success).toBe(false);
            expect(res.code).toBe('messaging/invalid-registration-token');
        });
    });

    describe('sendToMultiple', () => {
        it('should send multicast push notification to multiple tokens', async () => {
            mockSendEachForMulticast.mockResolvedValue({ successCount: 2, failureCount: 0 });

            const tokens = ['token_1', 'token_2'];
            const notification = { title: 'Offer!', body: '20% off on Homestays' };

            const res = await PushNotificationService.sendToMultiple(tokens, notification);

            expect(res.success).toBe(true);
            expect(mockSendEachForMulticast).toHaveBeenCalledWith(expect.objectContaining({
                tokens,
                notification: expect.objectContaining({ title: 'Offer!' })
            }));
        });

        it('should return error if no tokens are provided', async () => {
            const res = await PushNotificationService.sendToMultiple([], { title: 'Test', body: 'Test' });
            expect(res.success).toBe(false);
            expect(res.error).toBe('No tokens provided');
        });
    });

    describe('sendToTopic', () => {
        it('should send notification to a topic successfully', async () => {
            mockSend.mockResolvedValue('topic_msg_id_1');

            const res = await PushNotificationService.sendToTopic('all_vendors', { title: 'Policy Update', body: 'New cancellation terms' });

            expect(res.success).toBe(true);
            expect(res.messageId).toBe('topic_msg_id_1');
            expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
                topic: 'all_vendors',
                notification: expect.objectContaining({ title: 'Policy Update' })
            }));
        });
    });
});
