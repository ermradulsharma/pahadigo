import Booking from '@/core/Models/Booking.js';
import Dispute from '@/core/Models/Dispute.js';
import AuditService from '@/core/Services/Admin/AuditService.js';
import RazorpayService from '@/core/Services/General/RazorpayService.js';
import NotificationService from '@/core/Services/General/NotificationService.js';
import { getAppConfig } from '@/core/Lib/appConfig.js';
import { PAYMENT_STATUS, BOOKING_STATUS, REFUND_STATUS } from '@/core/Constants/index.js';

/**
 * BookingService (Admin Role)
 * Administration of system-wide reservations, dispute resolution, and payouts.
 */
class BookingService {
  async getAllBookings(filter = {}, page = 1, limit = 10) {
    const query = {};
    if (filter.status && filter.status !== 'all') query.status = filter.status;
    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query).populate('user', 'name email').populate('vendor', 'businessName ownerName businessEmail').populate('package', 'title price').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);
    return { bookings, total, totalPages: Math.ceil(total / limit) };
  }

  async getBookingById(id) {
    return await Booking.findById(id).populate('user', 'name email phone').populate('vendor', 'businessName ownerName phone email businessEmail').populate('package', 'title price');
  }

  async getPaymentHistory() {
    return await Booking.find({ paymentStatus: { $in: ['paid', 'refunded', 'partially_refunded'] } }).select('bookingCode user vendor item pricing payment status occupancy payout createdAt').populate('user', 'name email').populate('vendor', 'businessName ownerName businessEmail bankDetails').sort({ createdAt: -1 });
  }

  async payoutBooking(data, req = null) {
    const { bookingId, amount, transactionId, note } = data;
    const booking = await Booking.findById(bookingId).populate('vendor');
    if (!booking) throw new Error("Booking Node Not Found");

    const settlementAmount = amount || booking.pricing?.basePrice || 0;

    // Execute Settlement Snapshot
    const snapshot = {
      'payout.status': 'paid',
      'payout.paidAt': new Date(),
      'payout.transactionId': transactionId || `MANUAL_SETTLE_${Date.now()}`,
      'payout.amount': settlementAmount,
      'payout.businessName': booking.vendor?.businessName,
      'payout.ownerName': booking.vendor?.ownerName,
      'payout.bankDetails': {
        accountHolderName: booking.vendor?.bankDetails?.accountHolderName,
        accountNumber: booking.vendor?.bankDetails?.accountNumber,
        ifscCode: booking.vendor?.bankDetails?.ifscCode,
        bankName: booking.vendor?.bankDetails?.bankName
      },
      adminNotes: note
    };

    const updatedBooking = await Booking.findByIdAndUpdate(bookingId, snapshot, { returnDocument: 'after' });
    if (req && req.user) await AuditService.logAction(req.user.id, 'PAYOUT', 'BOOKING', bookingId, { amount, transactionId }, req);
    return updatedBooking;
  }

  async refundBooking(data, req = null) {
    const { bookingId, amount, reason } = data;

    const booking = await Booking.findById(bookingId);
    if (!booking) throw new Error("Booking not found");
    if (![PAYMENT_STATUS.PAID, PAYMENT_STATUS.REFUND_PENDING].includes(booking.paymentStatus.toLowerCase())) {
      throw new Error("Only paid or refund-pending bookings can be refunded");
    }
    if (!booking.payment.paymentId) throw new Error("No payment ID found for this booking.");

    const config = await getAppConfig();
    const razorpayConfig = config?.razorpay;

    // 1. Trigger actual refund on Razorpay
    const refundResponse = await RazorpayService.createRefund(booking.payment.paymentId, amount, razorpayConfig);

    // 2. Update Database Record
    booking.pricing.refundStatus = REFUND_STATUS.REFUNDED;
    booking.pricing.refundAmount = amount;
    booking.pricing.refundDate = new Date();
    booking.pricing.refundId = refundResponse.id;
    booking.status = BOOKING_STATUS.CANCELLED;
    booking.paymentStatus = PAYMENT_STATUS.REFUNDED;
    booking.adminNotes = reason;
    booking.timeline.push({ status: 'Fund Refunded', remarks: `Admin processed refund of ₹${amount} via ${booking.payment.gateway}. Refund ID: ${refundResponse.id}`, actor: req?.user?.id || 'System' });
    await booking.save();
    if (req && req.user) await AuditService.logAction(req.user.id, 'REFUND', 'BOOKING', bookingId, { amount, reason, refundId: refundResponse.id }, req);
    return booking;
  }

  async getDisputes(filter = {}, page = 1, limit = 20) {
    const query = {};
    if (filter.status) query.status = filter.status;
    if (filter.vendorId) query.vendorId = filter.vendorId;

    const total = await Dispute.countDocuments(query);
    const disputes = await Dispute.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return { disputes, total, totalPages: Math.ceil(total / limit) };
  }

  async resolveDispute(adminId, disputeId, decision, adminNotes, req = null) {
    const dispute = await Dispute.findByIdAndUpdate(disputeId, {
      status: decision,
      adminNotes,
      resolvedAt: new Date(),
      resolvedBy: adminId
    }, { returnDocument: 'after' });

    if (req && req.user) await AuditService.logAction(adminId, 'RESOLVE', 'DISPUTE', disputeId, { decision }, req);
    return dispute;
  }

  async generateAndSendInvoice(id) {
    const booking = await Booking.findById(id)
      .populate('user', 'email name')
      .populate('vendor', 'businessEmail businessName');

    if (!booking) throw new Error('Booking Node Not Found');

    // Notify Traveller
    if (booking.user?.email) {
      await NotificationService.sendInvoice(booking.user.email, booking._id, 'TRAVELLER');
    }

    // Notify Vendor
    if (booking.vendor?.businessEmail) {
      await NotificationService.sendInvoice(booking.vendor.businessEmail, booking._id, 'VENDOR');
    }

    // Audit Trail
    booking.timeline.push({
      status: 'Invoice Dispatched',
      remarks: `Official invoice generated and transmitted to traveller and vendor nodes via automated delivery systems.`,
      timestamp: new Date()
    });

    await booking.save();
    return booking;
  }
}

export default new BookingService();
