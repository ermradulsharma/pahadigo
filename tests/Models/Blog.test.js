import Blog from '@/core/Models/Blog.js';
import { cleanDatabase } from '../Helpers/testUtils.js';

describe('Industry Standard: Blog Data Model Structure', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    it('[Success] should be correctly defined', () => {
        expect(Blog).toBeDefined();
    });

    it('[Integrity] should have a valid physical schema with required blog fields', () => {
        const schema = Blog.schema || Blog;
        expect(schema.paths || schema.obj).toBeDefined();

        const paths = schema.paths;
        expect(paths.title).toBeDefined();
        expect(paths.slug).toBeDefined();
        expect(paths.content).toBeDefined();
        expect(paths.status).toBeDefined();
    });
});
