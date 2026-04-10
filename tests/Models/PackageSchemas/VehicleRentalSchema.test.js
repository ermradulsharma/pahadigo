import VehicleRentalSchema from '@/models/PackageSchemas/VehicleRentalSchema';
import { cleanDatabase } from '../../Helpers/testUtils.js';

describe('Industry Standard: VehicleRentalSchema Data Structure', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    it('[Success] should be correctly defined', async () => {
        expect(VehicleRentalSchema).toBeDefined();
    });

    it('[Integrity] should have a valid physical or logical schema', async () => {
        const schema = VehicleRentalSchema.schema || VehicleRentalSchema;
        expect(schema.paths || schema.obj).toBeDefined();
    });
});
