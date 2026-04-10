import Review from '@/models/Review.js';
import Booking from '@/models/Booking.js';
import Package from '@/models/Package.js';
import BusinessService from '@/services/Vendor/BusinessService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';
import { successResponse, errorResponse } from '@/helpers/response.js';

class ReviewController {
    // POST /traveller/reviews
    async addReview(req) {
        try {
            const user = req.user;
            if (!user) return errorResponse(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.UNAUTHORIZED, {});

            const body = req.validData || req.jsonBody || await req.json();
            const { bookingId, rating, comment } = body;

            // Verify booking belongs to user
            const booking = await Booking.findOne({ _id: bookingId, user: user.id });
            if (!booking) {
                return errorResponse(HTTP_STATUS.NOT_FOUND, "Booking not found", {});
            }

            // Check if review already exists for this booking logic
            const existingReview = await Review.findOne({
                user: user.id,
                package: booking.package,
                serviceId: booking.preferences?.itemId
            });

            if (existingReview) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, "You have already reviewed this service", {});
            }

            const vendorId = booking.vendor || await Package.findById(booking.package).select('vendor').then(p => p?.vendor);
            const review = await Review.create({
                user: user.id,
                vendor: vendorId,
                package: booking.package,
                serviceId: booking.preferences?.itemId,
                rating,
                comment
            });

            if (vendorId) {
                await BusinessService.evaluateVendorTrustBadge(vendorId);
            }

            return successResponse(HTTP_STATUS.OK, "Review submitted successfully", { review });
        } catch (error) {
            console.error("addReview error:", error);
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
        }
    }
}

const reviewController = new ReviewController();
export default reviewController;
