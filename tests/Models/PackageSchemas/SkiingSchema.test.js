import SkiingSchema from '@/models/PackageSchemas/SkiingSchema';
import { cleanDatabase } from '../../Helpers/testUtils.js';

describe('Industry Standard: SkiingSchema Data Structure', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    it('[Success] should be correctly defined', async () => {
        expect(SkiingSchema).toBeDefined();
    });

    it('[Integrity] should have a valid physical or logical schema', async () => {
        const schema = SkiingSchema.schema || SkiingSchema;
        expect(schema.paths || schema.obj).toBeDefined();
    });
});
