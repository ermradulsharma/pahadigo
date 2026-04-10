import CustomTripSchema from '@/models/PackageSchemas/CustomTripSchema';
import { cleanDatabase } from '../../Helpers/testUtils.js';

describe('Industry Standard: CustomTripSchema Data Structure', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    it('[Success] should be correctly defined', async () => {
        expect(CustomTripSchema).toBeDefined();
    });

    it('[Integrity] should have a valid physical or logical schema', async () => {
        const schema = CustomTripSchema.schema || CustomTripSchema;
        expect(schema.paths || schema.obj).toBeDefined();
    });
});
