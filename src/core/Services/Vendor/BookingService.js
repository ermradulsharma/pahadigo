import Booking from '@/core/Models/Booking.js';
import NotificationService from '@/core/Services/General/NotificationService.js';
import { RESPONSE_MESSAGES, BOOKING_STATUS, PAYMENT_STATUS } from '@/core/Constants/index.js';

class BookingService {
    /**
     * Verify Start OTP from Traveller to begin the service
     */
    async verifyStartOTP(bookingId, vendorId, otp) {
        const booking = await Booking.findOne({ _id: bookingId, vendor: vendorId });
        if (!booking) throw new Error(RESPONSE_MESSAGES.BOOKING.NOT_FOUND);

        if (booking.verification.startOTP !== otp) {
            throw new Error("Invalid Start OTP provided by Traveller");
        }

        if (booking.verification.isStartVerified) {
            throw new Error("Service already started for this booking.");
        }

        booking.verification.isStartVerified = true;
        booking.verification.startVerifiedAt = new Date();
        booking.status = BOOKING_STATUS.ONGOING;

        booking.timeline.push({
            status: 'Service Started',
            remarks: 'Start OTP verified. Trip/Stay is now ongoing.',
            actor: vendorId
        });

        await booking.save();
        return booking;
    }

    /**
     * Verify End OTP from Traveller to complete the service
     */
    async verifyEndOTP(bookingId, vendorId, otp) {
        const booking = await Booking.findOne({ _id: bookingId, vendor: vendorId });
        if (!booking) throw new Error(RESPONSE_MESSAGES.BOOKING.NOT_FOUND);

        if (!booking.verification.isStartVerified) {
            throw new Error("Cannot end service before it has started.");
        }

        if (booking.verification.endOTP !== otp) {
            throw new Error("Invalid End OTP provided by Traveller");
        }

        booking.verification.isEndVerified = true;
        booking.verification.endVerifiedAt = new Date();
        booking.status = BOOKING_STATUS.COMPLETED;

        booking.timeline.push({
            status: 'Service Completed',
            remarks: 'End OTP verified. Trip/Stay marked as completed.',
            actor: vendorId
        });

        await booking.save();
        NotificationService.notifyBookingStatus(bookingId, 'completed');
        return booking;
    }

    /**
     * Sync bulk offline OTP verifications from the Vendor App
     */
    async syncOfflineVerifications(vendorId, syncData) {
        const results = [];

        for (const record of syncData) {
            const { bookingId, type, otp, timestamp } = record;
            try {
                const booking = await Booking.findOne({ _id: bookingId, vendor: vendorId });
                if (!booking) throw new Error(RESPONSE_MESSAGES.BOOKING.NOT_FOUND);

                const syncDate = new Date(timestamp);

                if (type === 'start') {
                    if (booking.verification.startOTP !== otp) throw new Error("Invalid Start OTP");
                    if (!booking.verification.isStartVerified) {
                        booking.verification.isStartVerified = true;
                        booking.verification.startVerifiedAt = syncDate;
                        booking.status = BOOKING_STATUS.ONGOING;
                        booking.timeline.push({
                            status: 'Service Started (Offline Sync)',
                            remarks: `Start OTP verified offline at ${syncDate.toLocaleString()}.`,
                            actor: vendorId
                        });
                        await booking.save();
                    }
                } else if (type === 'end') {
                    if (!booking.verification.isStartVerified) throw new Error("Cannot end service before it has started");
                    if (booking.verification.endOTP !== otp) throw new Error("Invalid End OTP");
                    if (!booking.verification.isEndVerified) {
                        booking.verification.isEndVerified = true;
                        booking.verification.endVerifiedAt = syncDate;
                        booking.status = BOOKING_STATUS.COMPLETED;
                        booking.timeline.push({
                            status: 'Service Completed (Offline Sync)',
                            remarks: `End OTP verified offline at ${syncDate.toLocaleString()}.`,
                            actor: vendorId
                        });
                        await booking.save();
                        NotificationService.notifyBookingStatus(bookingId, 'completed');
                    }
                }

                results.push({ bookingId, type, success: true });
            } catch (error) {
                results.push({ bookingId, type, success: false, error: error.message });
            }
        }

        return results;
    }

    /**
     * Update operational status of a booking (Industry Standard)
     */
    async updateBookingStatus(bookingId, vendorId, status) {
        const booking = await Booking.findOne({ _id: bookingId, vendor: vendorId });
        if (!booking) throw new Error(RESPONSE_MESSAGES.BOOKING.NOT_FOUND);

        booking.status = status;
        booking.timeline.push({
            status: 'Status Updated',
            remarks: `Booking status changed to ${status}`,
            actor: vendorId
        });

        await booking.save();
        NotificationService.notifyBookingStatus(bookingId, status);
        return booking;
    }

    /**
     * Log a timeline event for a booking (Industry Standard)
     */
    async logTimelineEvent(bookingId, title, remarks, actor) {
        const booking = await Booking.findById(bookingId);
        if (!booking) throw new Error(RESPONSE_MESSAGES.BOOKING.NOT_FOUND);

        booking.timeline.push({
            status: title,
            remarks: remarks,
            actor: actor
        });

        if (title.toLowerCase() === 'trip completed' || title.toLowerCase() === 'booking completed') {
            booking.status = BOOKING_STATUS.COMPLETED;
        }

        await booking.save();
        return booking.timeline;
    }

    /**
     * Vendor initiated cancellation
     */
    async cancelBooking(bookingId, vendorId, reason) {
        const booking = await Booking.findOne({ _id: bookingId, vendor: vendorId });
        if (!booking) throw new Error(RESPONSE_MESSAGES.BOOKING.NOT_FOUND);

        if (booking.status === BOOKING_STATUS.CANCELLED) {
            throw new Error("Booking is already cancelled.");
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

        await booking.save();
        NotificationService.notifyBookingStatus(bookingId, 'cancelled');
        return booking;
    }
}

export default new BookingService();
