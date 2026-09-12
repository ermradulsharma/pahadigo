import ReviewController from '@/core/Controllers/Traveller/ReviewController.js';
import { wrap } from '@/core/Routes/helpers.js';
import { schemas } from '@/core/Helpers/validation.js';

export default [
    { method: 'POST', path: '/:bookingId/review', schema: schemas.submitReview, handler: wrap(() => ReviewController, 'submitReview') },
];
