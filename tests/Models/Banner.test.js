import Banner from '@/models/Banner';
import { cleanDatabase } from '../Helpers/testUtils.js';

describe('Industry Standard: Banner Data Structure', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    it('[Success] should be correctly defined', async () => {
        expect(Banner).toBeDefined();
    });

    it('[Integrity] should have a valid physical or logical schema', async () => {
        const schema = Banner.schema || Banner;
        expect(schema.paths || schema.obj).toBeDefined();
    });
});
