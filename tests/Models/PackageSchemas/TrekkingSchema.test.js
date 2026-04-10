import TrekkingSchema from '@/models/PackageSchemas/TrekkingSchema';
import { cleanDatabase } from '../../Helpers/testUtils.js';

describe('Industry Standard: TrekkingSchema Data Structure', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    it('[Success] should be correctly defined', async () => {
        expect(TrekkingSchema).toBeDefined();
    });

    it('[Integrity] should have a valid physical or logical schema', async () => {
        const schema = TrekkingSchema.schema || TrekkingSchema;
        expect(schema.paths || schema.obj).toBeDefined();
    });
});
