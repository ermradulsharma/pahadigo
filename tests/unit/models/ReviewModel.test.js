import mongoose from 'mongoose';
import Review from '../../../src/core/Models/Review.js';

describe('ReviewModel Test Suite', () => {

    it('should validate required user and vendor references', async () => {
        const review = new Review({ rating: 4 });
        let error;
        try {
            await review.validate();
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error.errors.user).toBeDefined();
        expect(error.errors.vendor).toBeDefined();
    });

    it('should enforce rating min and max constraints (1-5)', async () => {
        const reviewTooHigh = new Review({
            user: new mongoose.Types.ObjectId(),
            vendor: new mongoose.Types.ObjectId(),
            rating: 6
        });

        const reviewTooLow = new Review({
            user: new mongoose.Types.ObjectId(),
            vendor: new mongoose.Types.ObjectId(),
            rating: 0
        });

        let highError, lowError;
        try { await reviewTooHigh.validate(); } catch (e) { highError = e; }
        try { await reviewTooLow.validate(); } catch (e) { lowError = e; }

        expect(highError).toBeDefined();
        expect(highError.errors.rating).toBeDefined();

        expect(lowError).toBeDefined();
        expect(lowError.errors.rating).toBeDefined();
    });

    it('should save a valid review', async () => {
        const review = new Review({
            user: new mongoose.Types.ObjectId(),
            vendor: new mongoose.Types.ObjectId(),
            rating: 5,
            comment: 'Excellent trip!',
            reply: {
                comment: 'Thanks!',
                repliedAt: new Date()
            }
        });

        const savedReview = await review.save();
        expect(savedReview._id).toBeDefined();
        expect(savedReview.isVisible).toBe(true);
        expect(savedReview.reply.comment).toBe('Thanks!');
    });
});
