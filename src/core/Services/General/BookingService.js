import mongoose from 'mongoose';
import Booking from '@/core/Models/Booking.js';
import NotificationService from '@/core/Services/General/NotificationService.js';
import { BOOKING_STATUS, PAYMENT_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import { getBookingById as fetchBookingById, getBookingBy } from '@/core/Helpers/queryHelpers.js';
import { AppError } from '@/core/Errors/AppError.js';

/**
 * BookingService (Common)
 * Handles core booking operations shared across roles, like payment updates.
 */
class BookingService {
  async getBookingById(id) {
    return await fetchBookingById(id, '', ['package', 'user']);
  }

  async updatePaymentStatus(orderId, paymentId, signatureOrStatus) {
    if (!orderId || !paymentId) throw AppError.badRequest('Order id and payment id are required.');

    const session = await mongoose.startSession();
    let updatedBooking;

    try {
      await session.withTransaction(async () => {
        const booking = await getBookingBy({ 'payment.orderId': orderId }, '', null, { session, lean: false });
        if (!booking) throw AppError.notFound(RESPONSE_MESSAGES.BOOKING.NOT_FOUND);

        if (!booking.payment) booking.payment = {};

        const alreadyPaid = booking.paymentStatus === PAYMENT_STATUS.PAID || booking.paymentStatus === 'paid';
        if (alreadyPaid) {
          if (booking.payment.paymentId && booking.payment.paymentId !== paymentId) {
            throw AppError.conflict('Payment order is already linked to a different payment.');
          }
          updatedBooking = booking;
          return;
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

        await booking.save({ session });
        updatedBooking = booking;
      });

      if (updatedBooking) {
        NotificationService.notifyBookingStatus(updatedBooking._id, BOOKING_STATUS.CONFIRMED);
      }

      return updatedBooking;
    } catch (error) {
      throw error;
    } finally {
      session.endSession();
    }
  }
}

export default new BookingService();
