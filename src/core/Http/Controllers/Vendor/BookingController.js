import BusinessService from '@/services/Vendor/BusinessService.js';
import BookingService from '@/services/Vendor/BookingService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';
import Controller from '@/controllers/Controller.js';

/**
 * BookingController (Vendor Role) - Comprehensive management of Business Timeline,
 * Customer Enrollments, and Operational Fulfillment.
 */
class BookingController extends Controller {

    // GET /vendor/bookings
    async getBookings(req) {
        try {
            const vendor = await BusinessService.getBusinessByUserId(req.user.id);
            if (!vendor) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

            const bookings = await BookingService.getVendorBookings(vendor._id);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCHED, bookings);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // GET /vendor/bookings/:id
    async getBookingById(req, { params }) {
        try {
            const vendor = await BusinessService.getBusinessByUserId(req.user.id);
            const booking = await BookingService.getBookingById(params.id);

            if (!booking || String(booking.vendor) !== String(vendor._id)) {
                return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.BOOKING.NOT_FOUND_OR_UNAUTHORIZED);
            }
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCHED, booking);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // PUT /vendor/bookings/:id/status
    async updateBookingStatus(req, { params }) {
        try {
            const body = req.payload;
            const vendor = await BusinessService.getBusinessByUserId(req.user.id);

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
            const vendor = await BusinessService.getBusinessByUserId(req.user.id);

            const result = await BookingService.logTimelineEvent(params.id, body.title, body.description, vendor.user);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.BOOKING.TIMELINE_ADDED, result);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }
}

const bookingController = new BookingController();
export default bookingController;
