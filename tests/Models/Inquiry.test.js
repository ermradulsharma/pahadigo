import Inquiry from '@/models/Inquiry';
import { cleanDatabase } from '../Helpers/testUtils.js';

describe('Industry Standard: Inquiry Data Structure', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    it('[Success] should be correctly defined', async () => {
        expect(Inquiry).toBeDefined();
    });

    it('[Integrity] should have a valid physical or logical schema', async () => {
        const schema = Inquiry.schema || Inquiry;
        expect(schema.paths || schema.obj).toBeDefined();
    });
});
