import CampingSchema from '@/models/PackageSchemas/CampingSchema';
import { cleanDatabase } from '../../Helpers/testUtils.js';

describe('Industry Standard: CampingSchema Data Structure', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    it('[Success] should be correctly defined', async () => {
        expect(CampingSchema).toBeDefined();
    });

    it('[Integrity] should have a valid physical or logical schema', async () => {
        const schema = CampingSchema.schema || CampingSchema;
        expect(schema.paths || schema.obj).toBeDefined();
    });
});
