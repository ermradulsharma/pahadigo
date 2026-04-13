import { jest } from '@jest/globals';
import NotificationService from '@/services/General/NotificationService.js';

describe('NotificationService', () => {
    beforeEach(() => {
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('sendOTPEmail should return true', async () => {
        const result = await NotificationService.sendOTPEmail('test@example.com', '123456');
        expect(result).toBe(true);
    });

    test('sendSMS should return true', async () => {
        const result = await NotificationService.sendSMS('1234567890', 'Test message');
        expect(result).toBe(true);
    });

    test('sendLoginAlertEmail should return true', async () => {
        const result = await NotificationService.sendLoginAlertEmail('test@example.com', { ip: '127.0.0.1' });
        expect(result).toBe(true);
    });

    test('sendLoginAlertSMS should return true', async () => {
        const result = await NotificationService.sendLoginAlertSMS('1234567890', { ip: '127.0.0.1' });
        expect(result).toBe(true);
    });

    test('notifyBookingStatus should return true', async () => {
        const result = await NotificationService.notifyBookingStatus('booking123', 'confirmed');
        expect(result).toBe(true);
    });
});
