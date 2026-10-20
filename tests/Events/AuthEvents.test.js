import { jest } from '@jest/globals';
import AuthEvents from '@/core/Events/AuthEvents.js';
import NotificationService from '@/core/Services/General/NotificationService.js';

import { NOTIFICATION } from '@/core/Constants/notification';

describe('AuthEvents', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(NotificationService, 'sendSecureCodeEmail').mockResolvedValue(true);
        jest.spyOn(NotificationService, 'sendAlertEmail').mockResolvedValue(true);
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('auth.otp should send email for email identifier', async () => {
        const identifier = 'test@test.com';
        const otp = '123456';

        await AuthEvents.emitAsync(NOTIFICATION.KEY.USER.OTP, { identifier, details: otp });

        expect(NotificationService.sendSecureCodeEmail).toHaveBeenCalledWith(identifier, otp);
    });

    test('auth.alert should send alert email', async () => {
        const identifier = 'test@test.com';
        const details = { name: 'Test User' };
        const metadata = { device: 'Phone', ip: '1.1.1.1' };

        await AuthEvents.emitAsync(NOTIFICATION.KEY.USER.ALERT, { identifier, details, metadata });

        expect(NotificationService.sendAlertEmail).toHaveBeenCalledWith(identifier, details, metadata);
    });
});
