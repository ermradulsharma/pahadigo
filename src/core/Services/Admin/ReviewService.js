import Review from '@/core/Models/Review.js';
import AuditService from '@/core/Services/Admin/AuditService.js';
import AppError from '@/core/Helpers/AppError.js';
import { getReviewsBy, updateById, deleteById } from '@/core/Helpers/queryHelpers.js';

/**
 * ReviewService (Admin Role)
 * Administration of user feedback, system-wide ratings, and service testimonials.
 */
class ReviewService {
  async getAllReviews() {
    return await getReviewsBy(
      {},
      '',
      [
        { path: 'user', select: 'name' },
        { path: 'vendor', select: 'businessName' }
      ],
      { createdAt: -1 }
    );
  }

  async toggleReviewVisibility(reviewId, isVisible, req = null) {
    const review = await updateById(Review, reviewId, { isVisible });
    if (!review) throw new AppError('Review not found', 404);
    if (req && req.user) {
      await AuditService.logAction(req.user.id, 'UPDATE_VISIBILITY', 'REVIEW', reviewId, { isVisible }, req);
    }
    return review;
  }

  async deleteReview(reviewId, req = null) {
    const review = await deleteById(Review, reviewId);
    if (!review) throw new AppError('Review not found', 404);
    if (req && req.user) await AuditService.logAction(req.user.id, 'DELETE', 'REVIEW', reviewId, {}, req);
    return review;
  }
}

export default new ReviewService();
