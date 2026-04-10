import ChardhamTourSchema from '@/models/PackageSchemas/ChardhamTourSchema';
import { cleanDatabase } from '../../Helpers/testUtils.js';

describe('Industry Standard: ChardhamTourSchema Data Structure', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    it('[Success] should be correctly defined', async () => {
        expect(ChardhamTourSchema).toBeDefined();
    });

    it('[Integrity] should have a valid physical or logical schema', async () => {
        const schema = ChardhamTourSchema.schema || ChardhamTourSchema;
        expect(schema.paths || schema.obj).toBeDefined();
    });
});
