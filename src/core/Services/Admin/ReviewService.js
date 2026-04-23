import Review from '@/core/Models/Review.js';
import AuditService from '@/core/Services/Admin/AuditService.js';

/**
 * ReviewService (Admin Role)
 * Administration of user feedback, system-wide ratings, and service testimonials.
 */
class ReviewService {
  async getAllReviews() {
    return await Review.find()
      .populate('user', 'name')
      .populate('vendor', 'businessName')
      .sort({ createdAt: -1 });
  }

  async toggleReviewVisibility(reviewId, isVisible, req = null) {
    const review = await Review.findByIdAndUpdate(reviewId, { isVisible }, { returnDocument: 'after' });
    if (req && req.user) {
      await AuditService.logAction(req.user.id, 'UPDATE_VISIBILITY', 'REVIEW', reviewId, { isVisible }, req);
    }
    return review;
  }

  async deleteReview(reviewId, req = null) {
    if (req && req.user) await AuditService.logAction(req.user.id, 'DELETE', 'REVIEW', reviewId, {}, req);
    return await Review.findByIdAndDelete(reviewId);
  }
}

export default new ReviewService();
