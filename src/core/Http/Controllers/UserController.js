import User from '@/models/User.js';
import Package from '@/models/Package.js';
import Booking from '@/models/Booking.js';
import Vendor from '@/models/Vendor.js';
import BookingService from '@/services/BookingService.js';
import PackageService from '@/services/PackageService.js';
import SearchLog from '@/models/SearchLog.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';
import { successResponse, errorResponse } from '@/helpers/response.js';

class UserController {

    // POST /user/book
    async bookPackage(req) {
        try {
            const user = req.user;
            if (!user) {
                return errorResponse(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.UNAUTHORIZED, {});
            }

            const body = req.jsonBody || await req.json();
            const { packageId, travelDate } = body;

            if (!packageId || !travelDate) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});
            }

            const pkg = await PackageService.getPackageById(packageId);
            if (!pkg) {
                return errorResponse(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.ERROR.PACKAGE_NOT_FOUND, {});
            }

            const bookingDate = new Date(travelDate);
            if (isNaN(bookingDate.getTime())) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.INVALID_DATE, {});
            }

            const booking = await BookingService.createBooking({
                userId: user.id,
                packageId: pkg._id,
                travelDate: bookingDate,
                price: pkg.price
            });

            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.BOOKING_CREATED, { booking });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER_ERROR, {});
        }
    }

    // GET /user/packages
    async browsePackages(req) {
        try {
            const url = new URL(req.url);
            const query = url.searchParams.get('q') || '';

            const packages = await PackageService.getAvailablePackages(query);

            // Log Search if query exists
            if (query) {
                try {
                    // Basic logging: update count if exists today or create new?
                    // Simple: just create new log or upsert.
                    // "Search Trends" aggregates by query.
                    await SearchLog.findOneAndUpdate(
                        { query: query.toLowerCase() },
                        {
                            $inc: { count: 1 },
                            $set: { lastSearched: new Date(), resultsCount: packages.length },
                            // Optional: User tracking via $push? Keep simple for stats.
                        },
                        { upsert: true, new: true }
                    );
                } catch (e) { console.error("Search Log Error", e); }
            }

            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCH, { packages });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER_ERROR, {});
        }
    }
}

export default new UserController();