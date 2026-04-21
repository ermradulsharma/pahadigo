import ReviewService from '@/services/Traveller/ReviewService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';
import Controller from '@/controllers/Controller.js';

/**
 * ReviewController (Traveller Role)
 */
class ReviewController extends Controller {

    // GET /traveller/reviews
    async getMyReviews(req) {
        try {
            const reviews = await ReviewService.getMyReviews(req.user.id);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.REVIEW.FETCHED, { reviews });
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // POST /traveller/reviews
    async submitReview(req) {
        try {
            const body = req.validData || req.jsonBody || await req.json();
            const review = await ReviewService.submitReview(req.user.id, body);
            return this.success(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.REVIEW.SUBMITTED, { review });
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // DELETE /traveller/reviews/:id
    async deleteReview(req, { params }) {
        try {
            const result = await ReviewService.deleteReview(req.user.id, params.id);
            if (!result) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.REVIEW.NOT_FOUND_OR_UNAUTHORIZED);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.REVIEW.RETRACTED);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }
}

const reviewController = new ReviewController();
export default reviewController;
