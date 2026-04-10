import HomestaySchema from '@/models/PackageSchemas/HomestaySchema';
import { cleanDatabase } from '../../Helpers/testUtils.js';

describe('Industry Standard: HomestaySchema Data Structure', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    it('[Success] should be correctly defined', async () => {
        expect(HomestaySchema).toBeDefined();
    });

    it('[Integrity] should have a valid physical or logical schema', async () => {
        const schema = HomestaySchema.schema || HomestaySchema;
        expect(schema.paths || schema.obj).toBeDefined();
    });
});
