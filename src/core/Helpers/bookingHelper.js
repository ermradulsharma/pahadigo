import { BOOKING_STATUS, PAYMENT_STATUS } from '../Constants/index.js';
import { businessPayload, getBusinessDetailsForBooking, userPayload } from './index.js';

/**
 * Booking Payload & Cancellation Policy Helpers
 */

/**
 * Calculates real-time refundable amount for a booking based on tiered cancellation policy.
 * - Only paid bookings are eligible for refund.
 * - > 7 days (168 hours) before start date: 100% refund
 * - 48 hours to 7 days before start date: 50% refund
 * - < 48 hours before start date (or already started): 0% refund
 * @param {Object} b - Lean or raw Booking object
 * @param {number|Date} [now=Date.now()] - Current timestamp for deterministic evaluation
 * @returns {number} Real-time refundable amount (0 if unpaid or non-refundable)
 */
export const calculateCancellationRefund = (b, now = Date.now()) => {
    if (!b) return 0;

    const isPaid = b.paymentStatus === PAYMENT_STATUS.PAID || b.paymentStatus === 'paid';
    if (!isPaid) return 0;

    if (!b.startDate) return 0;

    const tripStartTime = new Date(b.startDate).getTime();
    if (isNaN(tripStartTime)) return 0;

    const currentTimestamp = typeof now === 'number' ? now : new Date(now).getTime();
    const msUntilTrip = tripStartTime - currentTimestamp;
    const hoursUntilTrip = msUntilTrip / (1000 * 60 * 60);

    let refundPercentage = 0;
    if (hoursUntilTrip > 7 * 24) {
        refundPercentage = 1.0;
    } else if (hoursUntilTrip >= 48) {
        refundPercentage = 0.5;
    } else {
        refundPercentage = 0.0;
    }

    const totalPaid = Number(b.pricing?.total) || 0;
    return Math.round(totalPaid * refundPercentage);
};

/**
 * Formats a booking document into standard clean API response payload.
 * Optionally includes detailed user and business payloads when specified.
 * Real-time computed properties:
 * - canCancel: true if booking is pending or confirmed
 * - refundOnCancel: calculated refundable amount (only when canCancel is true)
 * @param {Object} b - Lean or raw Booking object
 * @param {Object} [options] - Optional flags (includeUser, includeBusiness, now)
 * @returns {Object|null} Formatted payload or null
 */
export const bookingPayload = (b, options = {}) => {
    if (!b) return null;
    const { includeUser = false, includeBusiness = false, now = Date.now() } = options;

    const res = {
        bookingId: b._id ? b._id.toString() : (b.id || ''),
        bookingCode: b.bookingCode || '',
        status: b.status || '',
        paymentStatus: b.paymentStatus || '',
        item: b.item || null,
        startDate: b.startDate || null,
        endDate: b.endDate || null,
        occupancy: b.occupancy || null,
        pricing: b.pricing || null
    };

    if (includeUser && b.user) {
        res.user = typeof b.user === 'object' && b.user !== null ? userPayload(b.user) : b.user;
    }

    if (includeBusiness && b.vendor) {
        res.business = typeof b.vendor === 'object' && b.vendor !== null ? getBusinessDetailsForBooking(b.vendor) : b.vendor;
    }

    if (b.payment?.orderId || b.payment?.paymentId) {
        res.payment = {
            orderId: b.payment?.orderId || null,
            paymentId: b.payment?.paymentId || null,
            paidAt: b.payment?.paidAt || null
        };
    }

    if (b.verification?.startOTP || b.verification?.endOTP) {
        res.verification = {
            startOTP: b.verification?.startOTP || null,
            isStartVerified: b.verification?.isStartVerified || false,
            endOTP: b.verification?.endOTP || null,
            isEndVerified: b.verification?.isEndVerified || false
        };
    }

    const canCancel = (b.status === BOOKING_STATUS.PENDING || b.status === BOOKING_STATUS.CONFIRMED) ? true : false;
    const refundOnCancel = canCancel ? calculateCancellationRefund(b, now) : 0;

    if (b.cancellation || canCancel) {
        res.cancellation = {
            canCancel,
            refundOnCancel,
            reason: b.cancellation?.reason || null,
            date: b.cancellation?.date || null,
            actor: b.cancellation?.actor || null,
            cancelledBy: b.cancellation?.cancelledBy || null,
            cancelledAt: b.cancellation?.cancelledAt || null,
            role: b.cancellation?.role || null
        };
    }

    return res;
};

export default {
    bookingPayload,
    calculateCancellationRefund
};
