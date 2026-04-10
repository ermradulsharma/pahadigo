import ParaglidingSchema from '@/models/PackageSchemas/ParaglidingSchema';
import { cleanDatabase } from '../../Helpers/testUtils.js';

describe('Industry Standard: ParaglidingSchema Data Structure', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    it('[Success] should be correctly defined', async () => {
        expect(ParaglidingSchema).toBeDefined();
    });

    it('[Integrity] should have a valid physical or logical schema', async () => {
        const schema = ParaglidingSchema.schema || ParaglidingSchema;
        expect(schema.paths || schema.obj).toBeDefined();
    });
});
