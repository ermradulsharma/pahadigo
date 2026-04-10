import VendorClosure from '@/models/VendorClosure';
import { cleanDatabase } from '../Helpers/testUtils.js';

describe('Industry Standard: VendorClosure Data Structure', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    it('[Success] should be correctly defined', async () => {
        expect(VendorClosure).toBeDefined();
    });

    it('[Integrity] should have a valid physical or logical schema', async () => {
        const schema = VendorClosure.schema || VendorClosure;
        expect(schema.paths || schema.obj).toBeDefined();
    });
});
