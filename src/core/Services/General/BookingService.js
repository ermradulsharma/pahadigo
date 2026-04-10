import Booking from '@/models/Booking.js';
import NotificationService from '@/services/General/NotificationService.js';
import { RESPONSE_MESSAGES } from '@/constants/index.js';

/**
 * BookingService (Common)
 * Handles core booking operations shared across roles, like payment updates.
 */
class BookingService {
    async getBookingById(id) {
        return await Booking.findById(id).populate('package').populate('user');
    }

    async updatePaymentStatus(orderId, paymentId, signatureOrStatus) {
        // Find booking by Razorpay Order ID
        const booking = await Booking.findOne({ 'razorpay.orderId': orderId });
        if (!booking) throw new Error(RESPONSE_MESSAGES.BOOKING.NOT_FOUND);

        booking.paymentStatus = 'paid';
        booking.status = 'confirmed';
        booking.razorpay.paymentId = paymentId;
        
        if (signatureOrStatus !== 'WEBHOOK_VERIFIED') {
            booking.razorpay.signature = signatureOrStatus;
        }

        booking.timeline.push({
            title: 'Payment Verified',
            description: `Payment ID: ${paymentId}. Status updated to confirmed.`,
            timestamp: new Date()
        });

        await booking.save();
        
        // Notify
        NotificationService.notifyBookingStatus(booking._id, 'confirmed');
        
        return booking;
    }
}

export default new BookingService();
