import RaftingSchema from '@/models/PackageSchemas/RaftingSchema';
import { cleanDatabase } from '../../Helpers/testUtils.js';

describe('Industry Standard: RaftingSchema Data Structure', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    it('[Success] should be correctly defined', async () => {
        expect(RaftingSchema).toBeDefined();
    });

    it('[Integrity] should have a valid physical or logical schema', async () => {
        const schema = RaftingSchema.schema || RaftingSchema;
        expect(schema.paths || schema.obj).toBeDefined();
    });
});
