import { jest } from '@jest/globals';
import BookingService from '@/services/General/BookingService.js';
import Booking from '@/models/Booking.js';
import NotificationService from '@/services/General/NotificationService.js';
import { RESPONSE_MESSAGES } from '@/constants/index.js';

describe('General BookingService', () => {
    beforeEach(() => {
        jest.spyOn(Booking, 'findById');
        jest.spyOn(Booking, 'findOne');
        jest.spyOn(NotificationService, 'notifyBookingStatus').mockImplementation(() => {});
    });
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getBookingById', () => {
        test('should return booking with populated fields', async () => {
            const mockBooking = { _id: 'booking123', package: {}, user: {} };
            const populateMock = jest.fn().mockReturnThis();
            Booking.findById.mockReturnValue({
                populate: populateMock
            });
            populateMock.mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockBooking)
            });

            const result = await BookingService.getBookingById('booking123');

            expect(Booking.findById).toHaveBeenCalledWith('booking123');
            expect(result).toEqual(mockBooking);
        });
    });

    describe('updatePaymentStatus', () => {
        test('should update status to paid and confirmed', async () => {
            const mockBooking = {
                _id: 'booking123',
                paymentStatus: 'pending',
                status: 'pending',
                razorpay: {},
                timeline: [],
                save: jest.fn().mockResolvedValue(true)
            };
            Booking.findOne.mockResolvedValue(mockBooking);

            const result = await BookingService.updatePaymentStatus('order123', 'pay123', 'sig123');

            expect(Booking.findOne).toHaveBeenCalledWith({ 'razorpay.orderId': 'order123' });
            expect(mockBooking.paymentStatus).toBe('paid');
            expect(mockBooking.status).toBe('confirmed');
            expect(mockBooking.razorpay.paymentId).toBe('pay123');
            expect(mockBooking.razorpay.signature).toBe('sig123');
            expect(mockBooking.timeline.length).toBe(1);
            expect(mockBooking.save).toHaveBeenCalled();
            expect(NotificationService.notifyBookingStatus).toHaveBeenCalledWith('booking123', 'confirmed');
            expect(result).toBe(mockBooking);
        });

        test('should handle WEBHOOK_VERIFIED status without setting signature', async () => {
            const mockBooking = {
                _id: 'booking123',
                save: jest.fn(),
                timeline: [],
                razorpay: {}
            };
            Booking.findOne.mockResolvedValue(mockBooking);

            await BookingService.updatePaymentStatus('order123', 'pay123', 'WEBHOOK_VERIFIED');

            expect(mockBooking.razorpay.signature).toBeUndefined();
        });

        test('should throw error if booking not found', async () => {
            Booking.findOne.mockResolvedValue(null);

            await expect(BookingService.updatePaymentStatus('order123', 'pay123', 'sig123'))
                .rejects.toThrow(RESPONSE_MESSAGES.BOOKING.NOT_FOUND);
        });
    });
});
