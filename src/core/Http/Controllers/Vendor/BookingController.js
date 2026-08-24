import Booking from '@/core/Models/Booking.js';
import BookingService from '@/core/Services/Vendor/BookingService.js';
import { getBookingById as qhGetBookingById, getBusinessByUserId, getManyBy } from '@/core/Helpers/queryHelpers.js';
import { bookingPayload } from '@/core/Helpers/bookingHelper.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import Controller from '@/core/Controllers/Controller.js';

/**
 * BookingController (Vendor Role) - Comprehensive management of Business Timeline,
 * Customer Enrollments, and Operational Fulfillment.
 */
class BookingController extends Controller {

    // POST /vendor/bookings/:id/verify-start
    async verifyStartOTP(req, { params }) {
        try {
            const body = req.payload;
            const vendor = await getBusinessByUserId(req.user.id);
            if (!vendor) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

            const result = await BookingService.verifyStartOTP(params.id, vendor._id, body.otp);
            return this.success(HTTP_STATUS.OK, 'Start OTP verified. Booking is now ongoing.', result);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    // POST /vendor/bookings/:id/verify-end
    async verifyEndOTP(req, { params }) {
        try {
            const body = req.payload;
            const vendor = await getBusinessByUserId(req.user.id);
            if (!vendor) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

            const result = await BookingService.verifyEndOTP(params.id, vendor._id, body.otp);
            return this.success(HTTP_STATUS.OK, 'End OTP verified. Booking completed.', result);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    // POST /vendor/bookings/otp/offline-sync
    async syncOfflineOTPs(req) {
        try {
            const body = req.payload;
            const vendor = await getBusinessByUserId(req.user.id);
            if (!vendor) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

            const result = await BookingService.syncOfflineVerifications(vendor._id, body.syncData);
            return this.success(HTTP_STATUS.OK, 'Offline OTPs synced successfully.', result);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    // GET /vendor/bookings
    async getBookings(req) {
        try {
            const vendor = await getBusinessByUserId(req.user.id);
            if (!vendor) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

            const bookings = await getManyBy(Booking, { vendor: vendor._id }, '', ['user', { path: 'vendor', populate: { path: 'user' } }], { createdAt: -1 });
            const responseData = bookings.map(b => bookingPayload(b));
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCHED, responseData);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // GET /vendor/bookings/:id
    async getBookingById(req, { params }) {
        try {
            const vendor = await getBusinessByUserId(req.user.id);
            if (!vendor) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

            const booking = await qhGetBookingById(params.id, '', ['user', { path: 'vendor', populate: { path: 'user' } }]);

            const vendorIdStr = vendor._id ? vendor._id.toString() : String(vendor);
            const bookingVendorStr = booking?.vendor?._id ? booking.vendor._id.toString() : String(booking?.vendor || '');

            if (!booking || bookingVendorStr !== vendorIdStr) {
                return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.BOOKING.NOT_FOUND_OR_UNAUTHORIZED);
            }

            const responseData = bookingPayload(booking, { includeUser: true, includeBusiness: true });
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCHED, responseData);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // PUT /vendor/bookings/:id/status
    async updateBookingStatus(req, { params }) {
        try {
            const body = req.payload;
            const vendor = await getBusinessByUserId(req.user.id);
            if (!vendor) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

            const result = await BookingService.updateBookingStatus(params.id, vendor._id, body.status);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.BOOKING.STATUS_UPDATED, result);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // POST /vendor/bookings/:id/timeline
    async addTimelineEvent(req, { params }) {
        try {
            const body = req.payload;
            const vendor = await getBusinessByUserId(req.user.id);
            if (!vendor) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

            const result = await BookingService.logTimelineEvent(params.id, body.title, body.description, vendor.user || req.user.id);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.BOOKING.TIMELINE_ADDED, result);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }
}

const bookingController = new BookingController();
export default bookingController;
