import SearchLog from '@/models/SearchLog';
import { cleanDatabase } from '../Helpers/testUtils.js';

describe('Industry Standard: SearchLog Data Structure', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    it('[Success] should be correctly defined', async () => {
        expect(SearchLog).toBeDefined();
    });

    it('[Integrity] should have a valid physical or logical schema', async () => {
        const schema = SearchLog.schema || SearchLog;
        expect(schema.paths || schema.obj).toBeDefined();
    });
});
