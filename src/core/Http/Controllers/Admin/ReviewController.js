import ReviewService from '@/core/Services/Admin/ReviewService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import Controller from '@/core/Controllers/Controller.js';
import { z } from 'zod';
import { validate } from '@/core/Helpers/validation.js';
import AppError from '@/core/Helpers/AppError.js';

const updateVisibilitySchema = z.object({
  isVisible: z.boolean()
});

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
      if (error instanceof AppError) return this.error(error.statusCode, error.message);
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // PATCH /admin/reviews/:id
  async updateReviewStatus(req, { params }) {
    try {
      const rawBody = await req.json();
      const { success, data, error } = validate(updateVisibilitySchema, rawBody);
      if (!success) throw new AppError(error, HTTP_STATUS.BAD_REQUEST);

      const review = await ReviewService.toggleReviewVisibility(params.id, data.isVisible, req);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.UPDATED, { review });
    } catch (error) {
      if (error instanceof AppError) return this.error(error.statusCode, error.message);
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // DELETE /admin/reviews/:id
  async rejectReview(req, { params }) {
    try {
      await ReviewService.deleteReview(params.id, req);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.DELETED);
    } catch (error) {
      if (error instanceof AppError) return this.error(error.statusCode, error.message);
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }
}

const reviewController = new ReviewController();
export default reviewController;
