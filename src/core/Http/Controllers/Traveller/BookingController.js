import Booking from '@/core/Models/Booking.js';
import { getBookingBy, getManyBy } from '@/core/Helpers/queryHelpers.js';
import PackageService from '@/core/Services/Traveller/PackageService.js';
import BookingService from '@/core/Services/Traveller/BookingService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import Controller from '@/core/Controllers/Controller.js';

/**
 * BookingController (Traveller Role) - Specialized management of customer-facing
 * reservations and transaction lifecycle.
 */
class BookingController extends Controller {

    // GET /traveller/bookings (List all my historical reservations)
    async getBookings(req) {
        try {
            const bookings = await getManyBy(Booking, { user: req.user.id }, '', null, { createdAt: -1 });
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.BOOKING.FETCHED_HISTORICAL, bookings);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // POST /traveller/bookings
    async initiateBooking(req, { params }) {
        try {
            const userId = req.user.id;
            const body = req.payload;
            const itemId = params.id;
            const booking = await BookingService.initiateBooking({ userId, body, itemId });
            return this.success(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.BOOKING.CREATED, booking);
        } catch (error) {
            console.error('Error in initiateBooking:', error);
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // GET /traveller/bookings/:id (Detailed operational overview)
    async getBookingById(req, { params }) {
        try {
            const booking = await getBookingBy({ _id: params.id, user: req.user.id });
            if (!booking) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.BOOKING.NOT_FOUND_OR_UNAUTHORIZED);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.BOOKING.FETCHED_DETAIL, booking);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // POST /traveller/bookings/:id/cancel (Request operational cancellation)
    async cancelBooking(req, { params }) {
        try {
            const booking = await getBookingBy({ _id: params.id, user: req.user.id });
            if (!booking) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.BOOKING.NOT_FOUND_OR_UNAUTHORIZED);
            if (booking.status === 'cancelled') return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.BOOKING.ALREADY_CANCELLED);
            const cancelledBooking = await BookingService.refundBooking(params.id, req);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.BOOKING.CANCELLED, cancelledBooking);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // POST /traveller/bookings/:id/payment (Initialize late-bound payment)
    async initializePayment(req, { params }) {
        try {
            const paymentDetails = await BookingService.initializePayment(params.id, req.user.id);
            return this.success(HTTP_STATUS.OK, "Payment order generated successfully.", paymentDetails);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // POST /traveller/bookings/:id/verify-payment
    async verifyPayment(req, { params }) {
        try {
            const body = req.payload;
            const booking = await BookingService.verifyBookingPayment(params.id, req.user.id, body);
            return this.success(HTTP_STATUS.OK, 'Payment verified and OTPs generated.', booking);
        } catch (error) {
            console.error('Error in verifyPayment:', error);
            return this.error(HTTP_STATUS.BAD_REQUEST, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // GET /traveller/bookings/:id/otps
    async getBookingOTP(req, { params }) {
        try {
            const result = await BookingService.getBookingOTP(params.id, req.user.id);
            return this.success(HTTP_STATUS.OK, `${result.type} retrieved.`, result);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
        }
    }



    // POST /traveller/bookings/:id/dispute
    async reportDispute(req, { params }) {
        try {
            const body = req.payload;

            // Handle Image Uploads for Evidence
            let evidenceUrls = [];

            // If user sends evidence as files (multipart/form-data)
            if (body.evidence && Array.isArray(body.evidence)) {
                const { uploadToCloudinary } = await import('@/core/Helpers/cloudinary.js');
                for (const item of body.evidence) {
                    if (item instanceof File || (item && item.size > 0)) {
                        const upload = await uploadToCloudinary(item, 'disputes');
                        evidenceUrls.push(upload.url);
                    } else if (typeof item === 'string') {
                        evidenceUrls.push(item);
                    }
                }
            } else if (body.evidence && (body.evidence instanceof File || body.evidence.size > 0)) {
                // Single file case
                const { uploadToCloudinary } = await import('@/core/Helpers/cloudinary.js');
                const upload = await uploadToCloudinary(body.evidence, 'disputes');
                evidenceUrls.push(upload.url);
            }

            const disputeData = {
                reason: body.reason,
                description: body.description,
                evidenceUrls: evidenceUrls.length > 0 ? evidenceUrls : (body.evidenceUrls || [])
            };

            const dispute = await BookingService.reportDispute(params.id, req.user.id, disputeData);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.DISPUTE.RAISED, dispute);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }
}

const bookingController = new BookingController();
export default bookingController;
