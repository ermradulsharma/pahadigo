import BungeeSchema from '@/models/PackageSchemas/BungeeSchema';
import { cleanDatabase } from '../../Helpers/testUtils.js';

describe('Industry Standard: BungeeSchema Data Structure', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    it('[Success] should be correctly defined', async () => {
        expect(BungeeSchema).toBeDefined();
    });

    it('[Integrity] should have a valid physical or logical schema', async () => {
        const schema = BungeeSchema.schema || BungeeSchema;
        expect(schema.paths || schema.obj).toBeDefined();
    });
});
