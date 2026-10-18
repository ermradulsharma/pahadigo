import Review from '@/core/Models/Review.js';
import Booking from '@/core/Models/Booking.js';
import BusinessService from '@/core/Services/Vendor/BusinessService.js';
import { AppError } from '@/core/Errors/AppError.js';
import { getManyBy, getBookingBy } from '@/core/Helpers/queryHelpers.js';
import { RESPONSE_MESSAGES } from '@/core/Constants/index.js';

/**
 * ReviewService (Traveller Role)
 */
class ReviewService {
    async getMyReviews(userId) {
        return await getManyBy(
            Review,
            { user: userId },
            '',
            [
                { path: 'package', select: 'title' },
                { path: 'vendor', select: 'businessName' }
            ],
            { createdAt: -1 }
        );
    }

    async submitReview(userId, data) {
        const { bookingId, rating, comment } = data;

        const booking = await getBookingBy({ _id: bookingId, user: userId });
        if (!booking) throw AppError.notFound(RESPONSE_MESSAGES.BOOKING.NOT_FOUND);

        // Enforcement: Traveller can only review completed bookings
        if (booking.status !== 'completed') {
            throw AppError.badRequest('You can only review a booking that has been completed.');
        }

        const review = await Review.findOneAndUpdate(
            { user: userId, booking: bookingId },
            {
                user: userId,
                vendor: booking.vendor,
                item: {
                    itemId: booking.item?.itemId,
                    itemType: booking.item?.itemType,
                    title: booking.item?.title
                },
                booking: bookingId,
                rating,
                comment,
                isVisible: true
            },
            { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true, lean: true }
        );

        if (booking.vendor) await BusinessService.calculateTrustBadge(booking.vendor);
        return review;
    }

    async deleteReview(userId, reviewId) {
        const deletedReview = await Review.findOneAndDelete({ _id: reviewId, user: userId }).lean();
        if (deletedReview?.vendor) {
            await BusinessService.calculateTrustBadge(deletedReview.vendor);
        }
        return deletedReview;
    }
}

export default new ReviewService();
