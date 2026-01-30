import Booking from '@/models/Booking.js';

class BookingService {
    async createBooking({ userId, packageId, travelDate, price }) {
        const booking = await Booking.create({
            user: userId,
            package: packageId,
            travelDate,
            totalPrice: price,
            status: 'pending',
            paymentStatus: 'pending'
        });
        return booking;
    }

    async getBookingById(bookingId) {
        return await Booking.findById(bookingId);
    }

    async processRefund(bookingId) {
        const booking = await Booking.findById(bookingId);
        if (!booking) throw new Error('Booking not found');

        booking.status = 'cancelled';
        booking.refundStatus = 'refunded';
        booking.refundAmount = booking.totalPrice;
        await booking.save();
        return booking;
    }

    async markPayout(bookingId) {
        const booking = await Booking.findById(bookingId);
        if (!booking) throw new Error('Booking not found');

        booking.payoutStatus = 'paid';
        await booking.save();
        return booking;
    }

    async updatePaymentStatus(orderId, paymentId, signature) {
        const booking = await Booking.findOne({ 'razorpay.orderId': orderId });
        if (!booking) throw new Error('Booking order mismatch');

        booking.paymentStatus = 'paid';
        booking.status = 'confirmed';
        booking.razorpay.paymentId = paymentId;
        booking.razorpay.signature = signature;
        await booking.save();
        return booking;
    }
}

const bookingService = new BookingService();
export default bookingService;