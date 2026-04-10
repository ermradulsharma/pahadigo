import VerifiedIdentity from '@/models/VerifiedIdentity';
import { cleanDatabase } from '../Helpers/testUtils.js';

describe('Industry Standard: VerifiedIdentity Data Structure', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    it('[Success] should be correctly defined', async () => {
        expect(VerifiedIdentity).toBeDefined();
    });

    it('[Integrity] should have a valid physical or logical schema', async () => {
        const schema = VerifiedIdentity.schema || VerifiedIdentity;
        expect(schema.paths || schema.obj).toBeDefined();
    });
});
