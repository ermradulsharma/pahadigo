import Booking from '@/models/Booking.js';
import Dispute from '@/models/Dispute.js';
import AuditService from './AuditService.js';

/**
 * BookingService (Admin Role)
 * Administration of system-wide reservations, dispute resolution, and payouts.
 */
class BookingService {
    async getAllBookings() {
        return await Booking.find()
            .populate('user', 'name email')
            .populate('package', 'title price')
            .sort({ createdAt: -1 });
    }

    async getBookingById(id) {
        return await Booking.findById(id).populate('user', 'name email phone').populate({
            path: 'package',
            populate: { path: 'vendor', select: 'businessName ownerName phone email' }
        });
    }

    async getPaymentHistory() {
        return await Booking.find({ $or: [{ paymentStatus: 'paid' }, { refundStatus: 'refunded' }] })
            .populate('user', 'name')
            .populate({ path: 'package', populate: { path: 'vendor', select: 'businessName' } });
    }

    async payoutBooking(data, req = null) {
        const { bookingId, amount, transactionId, note } = data;
        const booking = await Booking.findByIdAndUpdate(bookingId, {
            payoutStatus: 'paid',
            payoutDate: new Date(),
            payoutTransactionId: transactionId,
            adminNotes: note
        }, { returnDocument: 'after' });

        if (req && req.user) await AuditService.logAction(req.user.id, 'PAYOUT', 'BOOKING', bookingId, { amount, transactionId }, req);
        return booking;
    }

    async refundBooking(data, req = null) {
        const { bookingId, amount, reason } = data;
        const booking = await Booking.findByIdAndUpdate(bookingId, {
            refundStatus: 'refunded',
            refundAmount: amount,
            refundDate: new Date(),
            status: 'cancelled',
            adminNotes: reason
        }, { returnDocument: 'after' });

        if (req && req.user) await AuditService.logAction(req.user.id, 'REFUND', 'BOOKING', bookingId, { amount, reason }, req);
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
}

export default new BookingService();
