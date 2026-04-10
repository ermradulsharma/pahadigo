import Policy from '@/models/Policy';
import { cleanDatabase } from '../Helpers/testUtils.js';

describe('Industry Standard: Policy Data Structure', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    it('[Success] should be correctly defined', async () => {
        expect(Policy).toBeDefined();
    });

    it('[Integrity] should have a valid physical or logical schema', async () => {
        const schema = Policy.schema || Policy;
        expect(schema.paths || schema.obj).toBeDefined();
    });
});
