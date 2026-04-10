import CategoryDocument from '@/models/CategoryDocument';
import { cleanDatabase } from '../Helpers/testUtils.js';

describe('Industry Standard: CategoryDocument Data Structure', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    it('[Success] should be correctly defined', async () => {
        expect(CategoryDocument).toBeDefined();
    });

    it('[Integrity] should have a valid physical or logical schema', async () => {
        const schema = CategoryDocument.schema || CategoryDocument;
        expect(schema.paths || schema.obj).toBeDefined();
    });
});
