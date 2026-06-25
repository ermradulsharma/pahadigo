import Review from '@/core/Models/Review.js';
import Booking from '@/core/Models/Booking.js';
import BusinessService from '@/core/Services/Vendor/BusinessService.js';
import { RESPONSE_MESSAGES } from '@/core/Constants/index.js';

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
    if (!booking) throw new Error(RESPONSE_MESSAGES.BOOKING.NOT_FOUND);

    // Enforcement: Traveller can only review completed bookings
    if (booking.status !== 'completed') {
      throw new Error('You can only review a booking that has been completed.');
    }

    const review = await Review.findOneAndUpdate(
      { user: userId, booking: bookingId },
      {
        user: userId,
        vendor: booking.vendor,
        package: booking.package,
        booking: bookingId,
        rating,
        comment,
        isVisible: true
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    if (booking.vendor) await BusinessService.calculateTrustBadge(booking.vendor);
    return review;
  }

  async deleteReview(userId, reviewId) {
    return await Review.findOneAndDelete({ _id: reviewId, user: userId });
  }
}

export default new ReviewService();
