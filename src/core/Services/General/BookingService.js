import Booking from '@/core/Models/Booking.js';
import NotificationService from '@/core/Services/General/NotificationService.js';
import { RESPONSE_MESSAGES } from '@/core/Constants/index.js';

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
    const booking = await Booking.findOne({ 'paymentGateway.orderId': orderId });
    if (!booking) throw new Error(RESPONSE_MESSAGES.BOOKING.NOT_FOUND);

    booking.paymentStatus = 'paid';
    booking.status = 'confirmed';

    if (!booking.paymentGateway) booking.paymentGateway = {};
    booking.paymentGateway.paymentId = paymentId;

    if (signatureOrStatus !== 'WEBHOOK_VERIFIED') {
      booking.paymentGateway.signature = signatureOrStatus;
    }

    booking.timeline.push({
      status: 'Payment Verified',
      remarks: `Payment ID: ${paymentId}. Status updated to confirmed.`,
      actor: 'SYSTEM'
    });

    await booking.save();

    // Notify
    NotificationService.notifyBookingStatus(booking._id, 'confirmed');

    return booking;
  }
}

export default new BookingService();
