import { businessPayload, userPayload } from './userProfileHelper.js';

/**
 * Booking Payload Formatting Helpers
 */

/**
 * Formats a booking document into standard clean API response payload.
 * Optionally includes detailed user and business payloads when specified.
 * @param {Object} b - Lean or raw Booking object
 * @param {Object} [options] - Optional flags (includeUser, includeBusiness)
 * @returns {Object|null} Formatted payload or null
 */
export const bookingPayload = (b, options = {}) => {
    if (!b) return null;
    const { includeUser = false, includeBusiness = false } = options;

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
        res.business = typeof b.vendor === 'object' && b.vendor !== null ? businessPayload(b.vendor) : b.vendor;
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
            endOTP: b.verification?.endOTP || null
        };
    }

    return res;
};

export default {
    bookingPayload
};
