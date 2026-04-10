import Package from '@/models/Package';
import { cleanDatabase } from '../Helpers/testUtils.js';

describe('Industry Standard: Package Data Structure', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    it('[Success] should be correctly defined', async () => {
        expect(Package).toBeDefined();
    });

    it('[Integrity] should have a valid physical or logical schema', async () => {
        const schema = Package.schema || Package;
        expect(schema.paths || schema.obj).toBeDefined();
    });
});
