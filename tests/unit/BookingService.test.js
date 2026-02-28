import BookingService from '../../src/core/Services/BookingService.js';
import Booking from '../../src/core/Models/Booking.js';
import mongoose from 'mongoose';

describe('BookingService Test Suite', () => {
    let mockBookingId;

    beforeEach(async () => {
        const booking = await Booking.create({
            user: new mongoose.Types.ObjectId(),
            package: new mongoose.Types.ObjectId(),
            travelDate: new Date(),
            totalPrice: 1000,
            status: 'pending',
            paymentStatus: 'pending',
            razorpay: { orderId: 'order_test_123' }
        });
        mockBookingId = booking._id;
    });

    it('should successfully process a refund', async () => {
        const refunded = await BookingService.processRefund(mockBookingId);
        expect(refunded.status).toBe('cancelled');
        expect(refunded.refundStatus).toBe('refunded');
        expect(refunded.refundAmount).toBe(1000);
    });

    it('should mark a booking for payout', async () => {
        const payout = await BookingService.markPayout(mockBookingId);
        expect(payout.payoutStatus).toBe('paid');
    });

    it('should update payment status based on razorpay signatures', async () => {
        const paid = await BookingService.updatePaymentStatus('order_test_123', 'pay_123', 'sig_123');
        expect(paid.paymentStatus).toBe('paid');
        expect(paid.status).toBe('confirmed');
        expect(paid.razorpay.paymentId).toBe('pay_123');
        expect(paid.razorpay.signature).toBe('sig_123');
    });

    it('should throw mismatch error for invalid order IDs', async () => {
        await expect(
            BookingService.updatePaymentStatus('order_invalid', 'pay', 'sig')
        ).rejects.toThrow('Booking order mismatch');
    });
});
