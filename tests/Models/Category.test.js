import Category from '@/models/Category';
import { cleanDatabase } from '../Helpers/testUtils.js';

describe('Industry Standard: Category Data Structure', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    it('[Success] should be correctly defined', async () => {
        expect(Category).toBeDefined();
    });

    it('[Integrity] should have a valid physical or logical schema', async () => {
        const schema = Category.schema || Category;
        expect(schema.paths || schema.obj).toBeDefined();
    });
});
