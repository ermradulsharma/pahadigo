import { jest } from '@jest/globals';
import AuthEvents from '@/core/Events/AuthEvents.js';
import NotificationService from '@/core/Services/General/NotificationService.js';

describe('AuthEvents', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(NotificationService, 'sendOTPEmail').mockResolvedValue(true);
        jest.spyOn(NotificationService, 'sendSMS').mockResolvedValue(true);
        jest.spyOn(NotificationService, 'sendLoginAlertEmail').mockResolvedValue(true);
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('otp.requested should send email for email identifier', (done) => {
        const identifier = 'test@test.com';
        const otp = '123456';

        AuthEvents.emit('otp.requested', { identifier, otp });

        // Since it's an async listener, we wait a bit or use setImmediate
        setImmediate(() => {
            expect(NotificationService.sendOTPEmail).toHaveBeenCalledWith(identifier, otp);
            done();
        });
    });

    test('otp.requested should send SMS for phone identifier', (done) => {
        const identifier = '1234567890';
        const otp = '123456';

        AuthEvents.emit('otp.requested', { identifier, otp });

        setImmediate(() => {
            expect(NotificationService.sendSMS).toHaveBeenCalled();
            done();
        });
    });

    test('auth.login_success should send login alert email', (done) => {
        const user = { email: 'test@test.com' };
        const metadata = { identifier: 'test@test.com', device: 'Phone', ip: '1.1.1.1' };

        AuthEvents.emit('auth.login_success', { user, metadata });

        setImmediate(() => {
            expect(NotificationService.sendLoginAlertEmail).toHaveBeenCalled();
            done();
        });
    });
});
