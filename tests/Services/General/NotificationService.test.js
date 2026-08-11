import { jest } from '@jest/globals';

const mockSendMail = jest.fn();
jest.unstable_mockModule('nodemailer', () => ({
    default: {
        createTransport: jest.fn(() => ({
            sendMail: mockSendMail
        }))
    }
}));

jest.unstable_mockModule('@/core/Lib/appConfig.js', () => ({
    getAppConfig: jest.fn(() => ({
        smtp: { host: 'localhost', port: 587, user: 'u', pass: 'p', from_name: 'PahadiGo', from_address: 'no-reply@pahadigo.com' }
    }))
}));

jest.unstable_mockModule('@/core/Helpers/TemplateHelper.js', () => ({
    renderTemplate: jest.fn(() => '<html>Email HTML</html>')
}));

jest.unstable_mockModule('@/core/Models/Booking.js', () => ({
    default: { findById: jest.fn() }
}));

jest.unstable_mockModule('@/core/Models/User.js', () => ({
    default: { findById: jest.fn() }
}));

jest.unstable_mockModule('@/core/Models/Vendor.js', () => ({
    default: { findById: jest.fn() }
}));

jest.unstable_mockModule('@/core/Lib/Queue/QueueService.js', () => ({
    enqueueInvoice: jest.fn(),
    enqueuePushNotification: jest.fn()
}));

const { default: NotificationService } = await import('@/core/Services/General/NotificationService.js');
const { renderTemplate } = await import('@/core/Helpers/TemplateHelper.js');
const Booking = (await import('@/core/Models/Booking.js')).default;
const User = (await import('@/core/Models/User.js')).default;
const Vendor = (await import('@/core/Models/Vendor.js')).default;
const { enqueueInvoice, enqueuePushNotification } = await import('@/core/Lib/Queue/QueueService.js');

describe('NotificationService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Email Functions', () => {
        it('should send OTP email successfully', async () => {
            mockSendMail.mockResolvedValue(true);
            const result = await NotificationService.sendOTPEmail('test@test.com', '123456');
            expect(result).toBe(true);
            expect(renderTemplate).toHaveBeenCalledWith('Emails/auth-otp.html', { OTP: '123456' });
            expect(mockSendMail).toHaveBeenCalled();
        });

        it('should return false on send OTP failure', async () => {
            mockSendMail.mockRejectedValue(new Error('SMTP Error'));
            const result = await NotificationService.sendOTPEmail('test@test.com', '123456');
            expect(result).toBe(false);
        });

        it('should send login alert email', async () => {
            mockSendMail.mockResolvedValue(true);
            const result = await NotificationService.sendLoginAlertEmail('test@test.com', { device: 'PC', ip: '1.1.1.1' });
            expect(result).toBe(true);
            expect(mockSendMail).toHaveBeenCalled();
        });

        it('should send vendor welcome email', async () => {
            mockSendMail.mockResolvedValue(true);
            const result = await NotificationService.sendVendorWelcomeEmail('v@v.com', 'My Vendor');
            expect(result).toBe(true);
        });
    });

    describe('notifyBookingStatus', () => {
        it('should notify traveller and vendor on booking confirmed', async () => {
            Booking.findById.mockReturnValue({
                lean: jest.fn().mockResolvedValue({
                    _id: 'b1', user: 't1', vendor: 'v1', bookingCode: 'B1', item: { title: 'Trip' }, startDate: new Date()
                })
            });
            Vendor.findById.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ user: 'vu1' }) }) });
            
            // Traveller profile
            User.findById.mockReturnValueOnce({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ fcmToken: 'token_t' }) }) })
            // Vendor profile
                         .mockReturnValueOnce({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ fcmToken: 'token_v' }) }) });

            const result = await NotificationService.notifyBookingStatus('b1', 'confirmed');
            
            expect(result).toBe(true);
            expect(enqueuePushNotification).toHaveBeenCalledTimes(2);
        });

        it('should skip push notification if fcmToken is missing', async () => {
            Booking.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'b1', user: 't1', vendor: 'v1', item: { title: 'T' } }) });
            Vendor.findById.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ user: 'vu1' }) }) });
            
            User.findById.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({}) }) }); // no fcmToken

            const result = await NotificationService.notifyBookingStatus('b1', 'confirmed');
            expect(result).toBe(true);
            expect(enqueuePushNotification).not.toHaveBeenCalled();
        });

        it('should return false if booking not found', async () => {
            Booking.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
            const result = await NotificationService.notifyBookingStatus('b1', 'confirmed');
            expect(result).toBe(false);
        });
    });

    describe('sendInvoice', () => {
        it('should enqueue invoice', async () => {
            enqueueInvoice.mockResolvedValue();
            const result = await NotificationService.sendInvoice('test@test.com', 'b1');
            expect(result).toBe(true);
            expect(enqueueInvoice).toHaveBeenCalledWith('test@test.com', 'b1', 'traveller');
        });

        it('should handle enqueue failure', async () => {
            enqueueInvoice.mockRejectedValue(new Error('Queue full'));
            const result = await NotificationService.sendInvoice('test@test.com', 'b1');
            expect(result).toBe(false);
        });
    });
});
