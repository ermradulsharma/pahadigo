import Booking from '@/core/Models/Booking.js';
import NotificationService from '@/core/Services/General/NotificationService.js';
import { BOOKING_STATUS, PAYMENT_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';

/**
 * BookingService (Common)
 * Handles core booking operations shared across roles, like payment updates.
 */
class BookingService {
  async getBookingById(id) {
    return await Booking.findById(id).populate('package').populate('user');
  }

  async updatePaymentStatus(orderId, paymentId, signatureOrStatus) {
    if (!orderId || !paymentId) throw new Error('Order id and payment id are required.');

    const booking = await Booking.findOne({ 'payment.orderId': orderId });
    if (!booking) throw new Error(RESPONSE_MESSAGES.BOOKING.NOT_FOUND);

    if (!booking.payment) booking.payment = {};

    const alreadyPaid = booking.paymentStatus === PAYMENT_STATUS.PAID || booking.paymentStatus === 'paid';
    if (alreadyPaid) {
      if (booking.payment.paymentId && booking.payment.paymentId !== paymentId) {
        throw new Error('Payment order is already linked to a different payment.');
      }
      return booking;
    }

    booking.paymentStatus = PAYMENT_STATUS.PAID;
    booking.status = BOOKING_STATUS.CONFIRMED;
    booking.payment.paymentId = paymentId;
    booking.payment.paidAt = new Date();

    if (signatureOrStatus !== 'WEBHOOK_VERIFIED') {
      booking.payment.signature = signatureOrStatus;
    }

    booking.timeline.push({
      status: 'Payment Verified',
      remarks: `Payment ID: ${paymentId}. Status updated to confirmed.`,
      actor: 'SYSTEM'
    });

    await booking.save();

    NotificationService.notifyBookingStatus(booking._id, BOOKING_STATUS.CONFIRMED);

    return booking;
  }
}

export default new BookingService();
