import Dispute from '@/models/Dispute';
import { cleanDatabase } from '../Helpers/testUtils.js';

describe('Industry Standard: Dispute Data Structure', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    it('[Success] should be correctly defined', async () => {
        expect(Dispute).toBeDefined();
    });

    it('[Integrity] should have a valid physical or logical schema', async () => {
        const schema = Dispute.schema || Dispute;
        expect(schema.paths || schema.obj).toBeDefined();
    });
});
