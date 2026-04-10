import Country from '@/models/Country';
import { cleanDatabase } from '../Helpers/testUtils.js';

describe('Industry Standard: Country Data Structure', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    it('[Success] should be correctly defined', async () => {
        expect(Country).toBeDefined();
    });

    it('[Integrity] should have a valid physical or logical schema', async () => {
        const schema = Country.schema || Country;
        expect(schema.paths || schema.obj).toBeDefined();
    });
});
