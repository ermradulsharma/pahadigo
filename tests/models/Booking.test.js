import mongoose from 'mongoose';
import Booking from '../../src/core/Models/Booking.js';

describe('BookingModel Test Suite', () => {

    it('should fail validation when required references are missing', async () => {
        const booking = new Booking({});
        let error;
        try {
            await booking.validate();
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error.errors.user).toBeDefined();
        expect(error.errors.package).toBeDefined();
        expect(error.errors.travelDate).toBeDefined();
    });

    it('should create a valid booking with defaults populated', async () => {
        const userId = new mongoose.Types.ObjectId();
        const packageId = new mongoose.Types.ObjectId();
        const travelDate = new Date();
        travelDate.setDate(travelDate.getDate() + 10); // 10 days in future

        const bookingData = {
            user: userId,
            package: packageId,
            travelDate,
            totalPrice: 15000
        };

        const booking = new Booking(bookingData);
        const savedBooking = await booking.save();

        expect(savedBooking._id).toBeDefined();
        expect(savedBooking.user.toString()).toBe(userId.toString());
        expect(savedBooking.status).toBe('pending');
        expect(savedBooking.paymentStatus).toBe('pending');
        expect(savedBooking.refundStatus).toBe('none');
        expect(savedBooking.bookingDate).toBeDefined();
    });

    it('should enforce enum restrictions on status fields', async () => {
        const booking = new Booking({
            user: new mongoose.Types.ObjectId(),
            package: new mongoose.Types.ObjectId(),
            travelDate: new Date(),
            status: 'INVALID_STATUS',
            paymentStatus: 'NOT_PAID'
        });

        let error;
        try {
            await booking.validate();
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error.errors.status).toBeDefined();
        expect(error.errors.paymentStatus).toBeDefined();
    });
});
