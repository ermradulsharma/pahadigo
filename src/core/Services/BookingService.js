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
        if (!booking) throw new Error(RESPONSE_MESSAGES.BOOKING.NOT_FOUND);

        booking.status = 'cancelled';
        booking.refundStatus = 'refunded';
        booking.refundAmount = booking.totalPrice;
        await booking.save();
        return booking;
    }

    async markPayout(bookingId) {
        const booking = await Booking.findById(bookingId);
        if (!booking) throw new Error(RESPONSE_MESSAGES.BOOKING.NOT_FOUND);

        booking.payoutStatus = 'paid';
        await booking.save();
        return booking;
    }

    async updatePaymentStatus(orderId, paymentId, signature) {
        // Atomic update prevents concurrent webhook race conditions
        const booking = await Booking.findOneAndUpdate(
            { 'razorpay.orderId': orderId, paymentStatus: 'pending' },
            {
                $set: {
                    paymentStatus: 'paid',
                    status: 'confirmed',
                    'razorpay.paymentId': paymentId,
                    'razorpay.signature': signature
                }
            },
            { new: true }
        );

        if (!booking) throw new Error('Booking order mismatch');
        return booking;
    }
}

const bookingService = new BookingService();
export default bookingService;