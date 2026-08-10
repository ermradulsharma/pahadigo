import Review from '@/models/Review.js';
import { cleanDatabase, generateId } from '../Helpers/testUtils.js';

describe('Industry Standard: Review Data Structure', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    it('[Success] should create a valid review with minimum fields', async () => {
        const reviewData = {
            user: generateId(),
            vendor: generateId(),
            booking: generateId(),
            item: { itemId: generateId(), itemType: 'hotel' },
            rating: 5,
            comment: 'Excellent experience!'
        };
        const review = await Review.create(reviewData);
        expect(review.rating).toBe(5);
        expect(review.isVisible).toBe(true);
    });

    it('[Failure] should fail if rating is out of range', async () => {
        const review = new Review({ rating: 6 });
        let err;
        try {
            await review.validate();
        } catch (e) {
            err = e;
        }
        expect(err.errors.rating).toBeDefined();
    });

    it('[Failure] should fail if required IDs are missing', async () => {
        const review = new Review({ rating: 4 });
        let err;
        try {
            await review.validate();
        } catch (e) {
            err = e;
        }
        expect(err.errors.user).toBeDefined();
        expect(err.errors.vendor).toBeDefined();
        expect(err.errors.booking).toBeDefined();
    });
});
