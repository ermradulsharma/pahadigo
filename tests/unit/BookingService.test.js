import BookingService from '../../src/services/BookingService.js';
import Booking from '../../src/models/Booking.js';
import mongoose from 'mongoose';

describe('BookingService', () => {
    const userId = new mongoose.Types.ObjectId();
    const packageId = new mongoose.Types.ObjectId();

    it('should create a pending booking', async () => {
        const travelDate = new Date();
        const price = 5000;

        const booking = await BookingService.createBooking({
            userId,
            packageId,
            travelDate,
            price
        });

        expect(booking).toBeDefined();
        expect(booking.status).toBe('pending');
        expect(booking.totalPrice).toBe(price);
        expect(booking.user.toString()).toBe(userId.toString());
    });

    it('should process a refund', async () => {
        const booking = await Booking.create({
            user: userId,
            package: packageId,
            travelDate: new Date(),
            totalPrice: 1000,
            status: 'confirmed',
            paymentStatus: 'paid'
        });

        const updated = await BookingService.processRefund(booking._id);
        expect(updated.status).toBe('cancelled');
        expect(updated.refundStatus).toBe('refunded');
        expect(updated.refundAmount).toBe(1000);
    });

    it('should mark a payout', async () => {
        const booking = await Booking.create({
            user: userId,
            package: packageId,
            travelDate: new Date(),
            totalPrice: 1000,
            status: 'confirmed',
            paymentStatus: 'paid'
        });

        const updated = await BookingService.markPayout(booking._id);
        expect(updated.payoutStatus).toBe('paid');
    });
});
