import VendorDocument from '@/models/VendorDocument';
import { cleanDatabase } from '../Helpers/testUtils.js';

describe('Industry Standard: VendorDocument Data Structure', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    it('[Success] should be correctly defined', async () => {
        expect(VendorDocument).toBeDefined();
    });

    it('[Integrity] should have a valid physical or logical schema', async () => {
        const schema = VendorDocument.schema || VendorDocument;
        expect(schema.paths || schema.obj).toBeDefined();
    });
});
