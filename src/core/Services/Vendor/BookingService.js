import mongoose from 'mongoose';
import Booking from '@/core/Models/Booking.js';
import NotificationService from '@/core/Services/General/NotificationService.js';
import CacheService from '@/core/Services/CacheService.js';
import { AppError } from '@/core/Errors/AppError.js';
import { getLogger } from '@/core/Lib/logger.js';
import { getBookingBy, getBookingById } from '@/core/Helpers/queryHelpers.js';
import { RESPONSE_MESSAGES, BOOKING_STATUS, PAYMENT_STATUS } from '@/core/Constants/index.js';

class BookingService {
    /**
     * Invalidate cached booking records across admin and vendor domains
     */
    async _invalidateBookingCaches(bookingId = null, vendorId = null) {
        try {
            await CacheService.del('admin:bookings:all');
            await CacheService.deletePattern('admin:bookings:*');
            await CacheService.del('admin:dashboard:stats');
            await CacheService.del('admin:dashboard:revenue');
            if (bookingId) {
                await CacheService.del(`admin:bookings:${bookingId}`);
            }
            if (vendorId) {
                await CacheService.del(`vendor:bookings:${vendorId}`);
                await CacheService.deletePattern(`vendor:bookings:${vendorId}:*`);
            }
        } catch (err) {
            getLogger().warn({ err, bookingId, vendorId }, '[Vendor BookingService] Cache invalidation warning');
        }
    }

    /**
     * Verify Start OTP from Traveller to begin the service
     */
    async verifyStartOTP(bookingId, vendorId, otp) {
        const session = await mongoose.startSession();
        let updatedBooking = null;

        try {
            await session.withTransaction(async () => {
                const booking = await getBookingBy({ _id: bookingId, vendor: vendorId }, '', null, { session, lean: false });
                if (!booking) throw AppError.notFound(RESPONSE_MESSAGES.BOOKING.NOT_FOUND);

                if (booking.verification.startOTP !== otp) {
                    throw AppError.badRequest("Invalid Start OTP provided by Traveller");
                }

                if (booking.verification.isStartVerified) {
                    throw AppError.badRequest("Service already started for this booking.");
                }

                booking.verification.isStartVerified = true;
                booking.verification.startVerifiedAt = new Date();
                booking.status = BOOKING_STATUS.ONGOING;

                booking.timeline.push({
                    status: 'Service Started',
                    remarks: 'Start OTP verified. Trip/Stay is now ongoing.',
                    actor: vendorId
                });

                await booking.save({ session });
                updatedBooking = booking;
            });
        } finally {
            await session.endSession();
        }

        await this._invalidateBookingCaches(bookingId, vendorId);
        return updatedBooking;
    }

    /**
     * Verify End OTP from Traveller to complete the service
     */
    async verifyEndOTP(bookingId, vendorId, otp) {
        const session = await mongoose.startSession();
        let updatedBooking = null;

        try {
            await session.withTransaction(async () => {
                const booking = await getBookingBy({ _id: bookingId, vendor: vendorId }, '', null, { session, lean: false });
                if (!booking) throw AppError.notFound(RESPONSE_MESSAGES.BOOKING.NOT_FOUND);

                if (!booking.verification.isStartVerified) {
                    throw AppError.badRequest("Cannot end service before it has started.");
                }

                if (booking.verification.endOTP !== otp) {
                    throw AppError.badRequest("Invalid End OTP provided by Traveller");
                }

                booking.verification.isEndVerified = true;
                booking.verification.endVerifiedAt = new Date();
                booking.status = BOOKING_STATUS.COMPLETED;

                booking.timeline.push({
                    status: 'Service Completed',
                    remarks: 'End OTP verified. Trip/Stay marked as completed.',
                    actor: vendorId
                });

                await booking.save({ session });
                updatedBooking = booking;
            });
        } finally {
            await session.endSession();
        }

        await this._invalidateBookingCaches(bookingId, vendorId);
        NotificationService.notifyBookingStatus(bookingId, 'completed');
        return updatedBooking;
    }

    /**
     * Sync bulk offline OTP verifications from the Vendor App
     */
    async syncOfflineVerifications(vendorId, syncData) {
        const results = [];
        let anySuccess = false;

        for (const record of syncData) {
            const { bookingId, type, otp, timestamp } = record;
            const session = await mongoose.startSession();

            try {
                await session.withTransaction(async () => {
                    const booking = await getBookingBy({ _id: bookingId, vendor: vendorId }, '', null, { session, lean: false });
                    if (!booking) throw AppError.notFound(RESPONSE_MESSAGES.BOOKING.NOT_FOUND);

                    const syncDate = new Date(timestamp);

                    if (type === 'start') {
                        if (booking.verification.startOTP !== otp) throw AppError.badRequest("Invalid Start OTP");
                        if (!booking.verification.isStartVerified) {
                            booking.verification.isStartVerified = true;
                            booking.verification.startVerifiedAt = syncDate;
                            booking.status = BOOKING_STATUS.ONGOING;
                            booking.timeline.push({
                                status: 'Service Started (Offline Sync)',
                                remarks: `Start OTP verified offline at ${syncDate.toLocaleString()}.`,
                                actor: vendorId
                            });
                            await booking.save({ session });
                        }
                    } else if (type === 'end') {
                        if (!booking.verification.isStartVerified) throw AppError.badRequest("Cannot end service before it has started");
                        if (booking.verification.endOTP !== otp) throw AppError.badRequest("Invalid End OTP");
                        if (!booking.verification.isEndVerified) {
                            booking.verification.isEndVerified = true;
                            booking.verification.endVerifiedAt = syncDate;
                            booking.status = BOOKING_STATUS.COMPLETED;
                            booking.timeline.push({
                                status: 'Service Completed (Offline Sync)',
                                remarks: `End OTP verified offline at ${syncDate.toLocaleString()}.`,
                                actor: vendorId
                            });
                            await booking.save({ session });
                        }
                    }
                });

                anySuccess = true;
                results.push({ bookingId, type, success: true });
                if (type === 'end') {
                    NotificationService.notifyBookingStatus(bookingId, 'completed');
                }
            } catch (error) {
                results.push({ bookingId, type, success: false, error: error.message });
            } finally {
                await session.endSession();
            }
        }

        if (anySuccess) {
            await this._invalidateBookingCaches(null, vendorId);
        }

        return results;
    }

    /**
     * Update operational status of a booking (Industry Standard)
     */
    async updateBookingStatus(bookingId, vendorId, status) {
        const session = await mongoose.startSession();
        let updatedBooking = null;

        try {
            await session.withTransaction(async () => {
                const booking = await getBookingBy({ _id: bookingId, vendor: vendorId }, '', null, { session, lean: false });
                if (!booking) throw AppError.notFound(RESPONSE_MESSAGES.BOOKING.NOT_FOUND);

                booking.status = status;
                booking.timeline.push({
                    status: 'Status Updated',
                    remarks: `Booking status changed to ${status}`,
                    actor: vendorId
                });

                await booking.save({ session });
                updatedBooking = booking;
            });
        } finally {
            await session.endSession();
        }

        await this._invalidateBookingCaches(bookingId, vendorId);
        NotificationService.notifyBookingStatus(bookingId, status);
        return updatedBooking;
    }

    /**
     * Log a timeline event for a booking (Industry Standard)
     */
    async logTimelineEvent(bookingId, title, remarks, actor) {
        const session = await mongoose.startSession();
        let updatedTimeline = null;

        try {
            await session.withTransaction(async () => {
                const booking = await getBookingById(bookingId, '', null, { session, lean: false });
                if (!booking) throw AppError.notFound(RESPONSE_MESSAGES.BOOKING.NOT_FOUND);

                booking.timeline.push({
                    status: title,
                    remarks: remarks,
                    actor: actor
                });

                if (title.toLowerCase() === 'trip completed' || title.toLowerCase() === 'booking completed') {
                    booking.status = BOOKING_STATUS.COMPLETED;
                }

                await booking.save({ session });
                updatedTimeline = booking.timeline;
            });
        } finally {
            await session.endSession();
        }

        await this._invalidateBookingCaches(bookingId);
        return updatedTimeline;
    }

    /**
     * Vendor initiated cancellation
     */
    async cancelBooking(bookingId, vendorId, reason) {
        const session = await mongoose.startSession();
        let updatedBooking = null;

        try {
            await session.withTransaction(async () => {
                const booking = await getBookingBy({ _id: bookingId, vendor: vendorId }, '', null, { session, lean: false });
                if (!booking) throw AppError.notFound(RESPONSE_MESSAGES.BOOKING.NOT_FOUND);

                if (booking.status === BOOKING_STATUS.CANCELLED) {
                    throw AppError.badRequest("Booking is already cancelled.");
                }

                booking.status = BOOKING_STATUS.CANCELLED;

                // If it was already paid, it goes to Refund Queue
                if (booking.paymentStatus === PAYMENT_STATUS.PAID) {
                    booking.paymentStatus = PAYMENT_STATUS.REFUND_PENDING;
                }

                booking.cancellation = {
                    reason: reason || 'Cancelled by Vendor',
                    cancelledBy: vendorId,
                    cancelledAt: new Date(),
                    role: 'vendor'
                };

                booking.timeline.push({
                    status: 'Cancelled by Vendor',
                    remarks: reason,
                    actor: vendorId
                });

                await booking.save({ session });
                updatedBooking = booking;
            });
        } finally {
            await session.endSession();
        }

        await this._invalidateBookingCaches(bookingId, vendorId);
        NotificationService.notifyBookingStatus(bookingId, 'cancelled');
        return updatedBooking;
    }
}

export default new BookingService();
