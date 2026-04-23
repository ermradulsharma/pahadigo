import { jest } from '@jest/globals';

jest.unstable_mockModule('@/models/Booking.js', () => ({
    default: {
        findOne: jest.fn(),
        findById: jest.fn(),
        find: jest.fn()
    }
}));

jest.unstable_mockModule('@/models/Package.js', () => ({
    default: { findOne: jest.fn() }
}));

jest.unstable_mockModule('@/services/General/NotificationService.js', () => ({
    default: { notifyBookingStatus: jest.fn() }
}));

const { default: BookingService } = await import('@/services/Vendor/BookingService.js');
const { default: Booking } = await import('@/models/Booking.js');
const { default: Package } = await import('@/models/Package.js');
const { default: NotificationService } = await import('@/services/General/NotificationService.js');

describe('Industry Standard: Vendor BookingService Logic', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('[verifyStartOTP]', () => {
        it('[Success] should verify start OTP and update status', async () => {
            const bookingId = 'b1';
            const vendorId = 'v1';
            const otp = '111111';
            const mockBooking = {
                _id: bookingId,
                verification: { startOTP: otp, isStartVerified: false },
                timeline: { push: jest.fn() },
                save: jest.fn()
            };
            Booking.findOne.mockResolvedValue(mockBooking);

            const result = await BookingService.verifyStartOTP(bookingId, vendorId, otp);

            expect(mockBooking.verification.isStartVerified).toBe(true);
            expect(mockBooking.status).toBe('ongoing');
            expect(mockBooking.save).toHaveBeenCalled();
            expect(result).toEqual(mockBooking);
        });

        it('[Failure] should throw error for incorrect OTP', async () => {
            const mockBooking = { verification: { startOTP: '111111' } };
            Booking.findOne.mockResolvedValue(mockBooking);

            await expect(BookingService.verifyStartOTP('b1', 'v1', '222222'))
                .rejects.toThrow("Invalid Start OTP provided by Traveller");
        });
    });

    describe('[updateBookingStatus]', () => {
        it('[Success] should update status and notify', async () => {
            const mockBooking = {
                _id: 'b1',
                timeline: { push: jest.fn() },
                save: jest.fn()
            };
            Booking.findOne.mockResolvedValue(mockBooking);

            await BookingService.updateBookingStatus('b1', 'v1', 'confirmed');

            expect(mockBooking.status).toBe('confirmed');
            expect(NotificationService.notifyBookingStatus).toHaveBeenCalledWith('b1', 'confirmed');
        });
    });
});
