import User from '@/models/User';
import { cleanDatabase } from '../Helpers/testUtils.js';

describe('Industry Standard: User Data Structure', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    it('[Success] should be correctly defined', async () => {
        expect(User).toBeDefined();
    });

    it('[Integrity] should have a valid physical or logical schema', async () => {
        const schema = User.schema || User;
        expect(schema.paths || schema.obj).toBeDefined();
    });
});
