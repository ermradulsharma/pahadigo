import Booking from '@/models/Booking.js';
import PackageService from '@/services/Traveller/PackageService.js';
import BookingService from '@/services/Traveller/BookingService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';
import Controller from '@/controllers/Controller.js';

/**
 * BookingController (Traveller Role) - Specialized management of customer-facing
 * reservations and transaction lifecycle.
 */
class BookingController extends Controller {

    // GET /traveller/bookings (List all my historical reservations)
    async getBookings(req) {
        try {
            const bookings = await Booking.find({ user: req.user.id })
                .populate('package', 'title location.city type')
                .populate('vendor', 'businessName')
                .sort({ createdAt: -1 });

            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.BOOKING.FETCHED_HISTORICAL, { bookings });
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // POST /traveller/bookings
    async initiateBooking(req) {
        try {
            const body = req.validData || req.jsonBody || await req.json();
            const { catalogId, category, itemId, startDate, endDate, totalTravellers = 1 } = body;

            const item = await PackageService.getAvailablePackageItem(itemId);
            if (!item) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.PACKAGE.NOT_FOUND);

            const price = item.pricing?.pricePerNight || item.pricing?.pricePerPerson || item.pricing?.price || 0;

            const booking = await BookingService.initiateBooking({
                userId: req.user.id,
                catalogId,
                category,
                itemId,
                startDate: new Date(startDate),
                endDate: new Date(endDate || startDate),
                price,
                totalTravellers
            });

            return this.success(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.BOOKING.CREATED, { booking });
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // GET /traveller/bookings/:id (Detailed operational overview)
    async getBookingById(req, { params }) {
        try {
            const booking = await Booking.findOne({ _id: params.id, user: req.user.id })
                .populate('package')
                .populate('vendor', 'businessName contactEmail supportPhone');

            if (!booking) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.BOOKING.NOT_FOUND_OR_UNAUTHORIZED);

            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.BOOKING.FETCHED_DETAIL, { booking });
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // POST /traveller/bookings/:id/cancel (Request operational cancellation)
    async cancelBooking(req, { params }) {
        try {
            const booking = await Booking.findOne({ _id: params.id, user: req.user.id });
            if (!booking) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.BOOKING.NOT_FOUND_OR_UNAUTHORIZED);

            if (booking.status === 'cancelled') return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.BOOKING.ALREADY_CANCELLED);

            const cancelledBooking = await BookingService.refundBooking(params.id, req);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.BOOKING.CANCELLED, { booking: cancelledBooking });
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // POST /traveller/bookings/:id/dispute
    async reportDispute(req, { params }) {
        try {
            const body = req.validData || req.jsonBody || await req.json();
            const dispute = await BookingService.reportDispute(params.id, req.user.id, body);
            return this.success(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.DISPUTE.RAISED, { dispute });
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }
}

const bookingController = new BookingController();
export default bookingController;
