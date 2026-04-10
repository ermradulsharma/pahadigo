import RateLimit from '@/models/RateLimit';
import { cleanDatabase } from '../Helpers/testUtils.js';

describe('Industry Standard: RateLimit Data Structure', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    it('[Success] should be correctly defined', async () => {
        expect(RateLimit).toBeDefined();
    });

    it('[Integrity] should have a valid physical or logical schema', async () => {
        const schema = RateLimit.schema || RateLimit;
        expect(schema.paths || schema.obj).toBeDefined();
    });
});
