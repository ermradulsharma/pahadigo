import Booking from '@/models/Booking.js';
import Package from '@/models/Package.js';
import BookingService from '@/services/BookingService.js';
import PackageService from '@/services/PackageService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';
import { successResponse, errorResponse } from '@/helpers/response.js';

class BookingController {
    
    // POST /traveller/book
    async createBooking(req) {
        try {
            const user = req.user;
            if (!user) {
                return errorResponse(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.UNAUTHORIZED, {});
            }

            const body = req.validData || req.jsonBody || await req.json();
            const { catalogId, category, itemId, travelDate } = body;

            const item = await PackageService.getGranularItem(catalogId, category, itemId);
            if (!item) {
                return errorResponse(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.PACKAGE.NOT_FOUND, {});
            }

            const bookingDate = new Date(travelDate);
            const price = item.pricing?.pricePerNight || item.pricing?.pricePerPerson || item.pricing?.price || 0;

            const booking = await BookingService.createBooking({
                userId: user.id,
                catalogId,
                category,
                itemId,
                travelDate: bookingDate,
                price
            });

            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.BOOKING.CREATED, { booking });
        } catch (error) {
            console.error("createBooking error:", error);
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
        }
    }

    // GET /traveller/bookings
    async getMyBookings(req) {
        try {
            const user = req.user;
            if (!user) return errorResponse(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.UNAUTHORIZED, {});

            const bookings = await Booking.find({ user: user.id })
                .populate('package', 'title location.city type')
                .populate('vendor', 'businessName')
                .sort({ createdAt: -1 });

            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.GENERIC, { bookings });
        } catch (error) {
            console.error("getMyBookings error:", error);
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
        }
    }

    // GET /traveller/bookings/:id
    async getBookingDetails(req, { params }) {
        try {
            const user = req.user;
            const bookingId = params.id;
            
            if (!user) return errorResponse(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.UNAUTHORIZED, {});

            const booking = await Booking.findOne({ _id: bookingId, user: user.id })
                .populate('package')
                .populate('vendor', 'businessName contactEmail supportPhone');

            if (!booking) {
                return errorResponse(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.ERROR.NOT_FOUND, {});
            }

            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.GENERIC, { booking });
        } catch (error) {
            console.error("getBookingDetails error:", error);
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
        }
    }

    // PATCH /traveller/bookings/:id/cancel
    async cancelBooking(req, { params }) {
        try {
            const user = req.user;
            const bookingId = params.id;

            if (!user) return errorResponse(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.UNAUTHORIZED, {});

            const booking = await Booking.findOne({ _id: bookingId, user: user.id });
            if (!booking) {
                return errorResponse(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.ERROR.NOT_FOUND, {});
            }

            if (booking.status === 'cancelled') {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, "Booking is already cancelled", {});
            }

            const cancelledBooking = await BookingService.processRefund(bookingId, req);

            return successResponse(HTTP_STATUS.OK, "Booking cancelled successfully", { booking: cancelledBooking });
        } catch (error) {
            console.error("cancelBooking error:", error);
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
        }
    }

    // POST /traveller/bookings/:id/dispute
    async raiseDispute(req, { params }) {
        try {
            const user = req.user;
            const bookingId = params.id;
            const body = req.jsonBody || await req.json();

            if (!user) return errorResponse(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.UNAUTHORIZED, {});
            
            if (!body.reason || !body.description) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});
            }

            const dispute = await BookingService.raiseDispute(bookingId, user.id, body);

            return successResponse(HTTP_STATUS.CREATED, "Dispute raised successfully", { dispute });
        } catch (error) {
            console.error("raiseDispute error:", error);
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
        }
    }
}

const bookingController = new BookingController();
export default bookingController;
