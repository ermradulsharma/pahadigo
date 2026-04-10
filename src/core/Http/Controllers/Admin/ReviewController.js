import ReviewService from '../../../Services/Admin/ReviewService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';
import Controller from '@/controllers/Controller.js';

/**
 * ReviewController (Admin Role)
 * Platform-wide moderation of customer feedback, service testimonials, and vendor trust.
 */
class ReviewController extends Controller {

  // GET /admin/reviews
  async getPendingReviews(req) {
    try {
      const reviews = await ReviewService.getAllReviews();
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCHED, { reviews });
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // PATCH /admin/reviews/:id
  async updateReviewStatus(req, { params }) {
    try {
      const body = req.validData || req.jsonBody || await req.json();
      const review = await ReviewService.toggleReviewVisibility(params.id, body.isVisible, req);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.UPDATED, { review });
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // DELETE /admin/reviews/:id
  async rejectReview(req, { params }) {
    try {
      await ReviewService.deleteReview(params.id, req);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.DELETED);
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }
}

const reviewController = new ReviewController();
export default reviewController;
