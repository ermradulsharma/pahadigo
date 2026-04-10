import Review from '@/models/Review.js';
import Booking from '@/models/Booking.js';
import BusinessService from '@/services/Vendor/BusinessService.js';

/**
 * ReviewService (Traveller Role)
 */
class ReviewService {
    async getMyReviews(userId) {
        return await Review.find({ user: userId })
            .populate('package', 'title')
            .populate('vendor', 'businessName')
            .sort({ createdAt: -1 });
    }

    async submitReview(userId, data) {
        const { bookingId, rating, comment } = data;

        const booking = await Booking.findOne({ _id: bookingId, user: userId });
        if (!booking) throw new Error("Associated booking not found");

        const existingReview = await Review.findOne({ user: userId, booking: bookingId });
        if (existingReview) throw new Error("Feedback already provided for this service");

        const review = await Review.create({
            user: userId,
            vendor: booking.vendor,
            package: booking.package,
            booking: bookingId,
            rating,
            comment,
            isVisible: true
        });

        if (booking.vendor) await BusinessService.evaluateVendorTrustBadge(booking.vendor);
        return review;
    }

    async deleteReview(userId, reviewId) {
        return await Review.findOneAndDelete({ _id: reviewId, user: userId });
    }
}

export default new ReviewService();
