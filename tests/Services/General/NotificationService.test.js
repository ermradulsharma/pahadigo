import { jest } from '@jest/globals';

// Store mock functions in a scope accessible to the mock factories
const mockBookingFindById = jest.fn();
const mockUserFindById = jest.fn();
const mockVendorFindById = jest.fn();
const mockSendToDevice = jest.fn();

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

// Mock Database Models
jest.unstable_mockModule('@/core/Models/Booking.js', () => ({
    default: {
        findById: jest.fn().mockImplementation(() => ({
            lean: jest.fn().mockImplementation(() => mockBookingFindById())
        }))
    }
}));

jest.unstable_mockModule('@/core/Models/User.js', () => ({
    default: {
        findById: jest.fn().mockImplementation(() => ({
            select: jest.fn().mockImplementation(() => ({
                lean: jest.fn().mockImplementation(() => mockUserFindById())
            }))
        }))
    }
}));

jest.unstable_mockModule('@/core/Models/Vendor.js', () => ({
    default: {
        findById: jest.fn().mockImplementation(() => ({
            select: jest.fn().mockImplementation(() => ({
                lean: jest.fn().mockImplementation(() => mockVendorFindById())
            }))
        }))
    }
}));

// Mock Push Notification Service
jest.unstable_mockModule('@/core/Services/PushNotificationService.js', () => ({
    PushNotificationService: {
        sendToDevice: mockSendToDevice
    }
}));

const { default: NotificationService } = await import('@/services/General/NotificationService.js');

describe('NotificationService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
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

    describe('notifyBookingStatus', () => {
        test('should return false if booking is not found', async () => {
            mockBookingFindById.mockResolvedValueOnce(null);

            const result = await NotificationService.notifyBookingStatus('invalid_id', 'confirmed');
            expect(result).toBe(false);
        });

        test('should send push notification to traveller and vendor on confirmed status', async () => {
            const mockBooking = {
                _id: 'booking_123',
                bookingCode: 'PH-CONF123',
                user: 'traveller_user_id',
                vendor: 'vendor_doc_id',
                startDate: new Date('2026-07-01'),
                item: { title: 'Trek Package' }
            };

            mockBookingFindById.mockResolvedValueOnce(mockBooking);
            mockVendorFindById.mockResolvedValueOnce({ user: 'vendor_user_id' });
            
            // Traveller user with FCM token
            mockUserFindById.mockResolvedValueOnce({ fcmToken: 'traveller_fcm_token' });
            // Vendor user with FCM token
            mockUserFindById.mockResolvedValueOnce({ fcmToken: 'vendor_fcm_token' });

            mockSendToDevice.mockResolvedValue({ success: true });

            const result = await NotificationService.notifyBookingStatus('booking_123', 'confirmed');
            expect(result).toBe(true);

            expect(mockSendToDevice).toHaveBeenCalledTimes(2);
            // Verify traveller notification
            expect(mockSendToDevice).toHaveBeenNthCalledWith(
                1,
                'traveller_fcm_token',
                {
                    title: 'Booking Confirmed!',
                    body: expect.stringContaining('Trek Package')
                },
                expect.objectContaining({
                    bookingId: 'booking_123',
                    status: 'confirmed'
                })
            );
            // Verify vendor notification
            expect(mockSendToDevice).toHaveBeenNthCalledWith(
                2,
                'vendor_fcm_token',
                {
                    title: 'New Booking Confirmed!',
                    body: expect.stringContaining('Trek Package')
                },
                expect.objectContaining({
                    bookingId: 'booking_123',
                    status: 'confirmed'
                })
            );
        });

        test('should send push notification only to traveller on created status', async () => {
            const mockBooking = {
                _id: 'booking_123',
                bookingCode: 'PH-INIT123',
                user: 'traveller_user_id',
                vendor: 'vendor_doc_id',
                item: { title: 'Rafting Package' }
            };

            mockBookingFindById.mockResolvedValueOnce(mockBooking);
            mockVendorFindById.mockResolvedValueOnce({ user: 'vendor_user_id' });
            mockUserFindById.mockResolvedValueOnce({ fcmToken: 'traveller_fcm_token' });

            const result = await NotificationService.notifyBookingStatus('booking_123', 'created');
            expect(result).toBe(true);

            expect(mockSendToDevice).toHaveBeenCalledTimes(1);
            expect(mockSendToDevice).toHaveBeenCalledWith(
                'traveller_fcm_token',
                {
                    title: 'Booking Initiated',
                    body: expect.stringContaining('Rafting Package')
                },
                expect.objectContaining({
                    status: 'created'
                })
            );
        });

        test('should handle missing FCM tokens gracefully', async () => {
            const mockBooking = {
                _id: 'booking_123',
                bookingCode: 'PH-CONF123',
                user: 'traveller_user_id',
                vendor: 'vendor_doc_id',
                item: { title: 'Trek Package' }
            };

            mockBookingFindById.mockResolvedValueOnce(mockBooking);
            mockVendorFindById.mockResolvedValueOnce({ user: 'vendor_user_id' });
            
            // Traveller user without FCM token
            mockUserFindById.mockResolvedValueOnce(null);
            // Vendor user without FCM token
            mockUserFindById.mockResolvedValueOnce({ fcmToken: null });

            const result = await NotificationService.notifyBookingStatus('booking_123', 'confirmed');
            expect(result).toBe(true);
            expect(mockSendToDevice).not.toHaveBeenCalled();
        });
    });
});
