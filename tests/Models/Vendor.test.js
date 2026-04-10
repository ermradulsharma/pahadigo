import Vendor from '@/models/Vendor';
import { cleanDatabase } from '../Helpers/testUtils.js';

describe('Industry Standard: Vendor Data Structure', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    it('[Success] should be correctly defined', async () => {
        expect(Vendor).toBeDefined();
    });

    it('[Integrity] should have a valid physical or logical schema', async () => {
        const schema = Vendor.schema || Vendor;
        expect(schema.paths || schema.obj).toBeDefined();
    });
});
