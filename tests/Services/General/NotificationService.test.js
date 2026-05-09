import { jest } from '@jest/globals';

jest.unstable_mockModule('nodemailer', () => ({
    default: {
        createTransport: jest.fn().mockReturnValue({
            sendMail: jest.fn().mockResolvedValue(true)
        })
    }
}));

jest.unstable_mockModule('@/core/Lib/appConfig.js', () => ({
    getAppConfig: jest.fn().mockResolvedValue({
        smtp: {
            host: 'mock.host',
            port: 587,
            user: 'mock',
            pass: 'mock',
            from_name: 'PahadiGo',
            from_address: 'test@pahadigo.com'
        }
    })
}));

jest.unstable_mockModule('@/core/Helpers/TemplateHelper.js', () => ({
    renderTemplate: jest.fn().mockResolvedValue('<html>Mock Template</html>')
}));

const { default: NotificationService } = await import('@/services/General/NotificationService.js');

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
