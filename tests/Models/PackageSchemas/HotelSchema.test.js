import HotelSchema from '@/models/PackageSchemas/HotelSchema';
import { cleanDatabase } from '../../Helpers/testUtils.js';

describe('Industry Standard: HotelSchema Data Structure', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    it('[Success] should be correctly defined', async () => {
        expect(HotelSchema).toBeDefined();
    });

    it('[Integrity] should have a valid physical or logical schema', async () => {
        const schema = HotelSchema.schema || HotelSchema;
        expect(schema.paths || schema.obj).toBeDefined();
    });
});
