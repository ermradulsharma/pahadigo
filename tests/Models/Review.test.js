import Review from '@/models/Review';
import { cleanDatabase } from '../Helpers/testUtils.js';

describe('Industry Standard: Review Data Structure', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    it('[Success] should be correctly defined', async () => {
        expect(Review).toBeDefined();
    });

    it('[Integrity] should have a valid physical or logical schema', async () => {
        const schema = Review.schema || Review;
        expect(schema.paths || schema.obj).toBeDefined();
    });
});
