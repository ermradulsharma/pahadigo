import Booking from '@/models/Booking';
import { cleanDatabase } from '../Helpers/testUtils.js';

describe('Industry Standard: Booking Data Structure', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    it('[Success] should be correctly defined', async () => {
        expect(Booking).toBeDefined();
    });

    it('[Integrity] should have a valid physical or logical schema', async () => {
        const schema = Booking.schema || Booking;
        expect(schema.paths || schema.obj).toBeDefined();
    });
});
