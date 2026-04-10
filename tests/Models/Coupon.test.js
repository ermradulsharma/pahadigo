import Coupon from '@/models/Coupon';
import { cleanDatabase } from '../Helpers/testUtils.js';

describe('Industry Standard: Coupon Data Structure', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    it('[Success] should be correctly defined', async () => {
        expect(Coupon).toBeDefined();
    });

    it('[Integrity] should have a valid physical or logical schema', async () => {
        const schema = Coupon.schema || Coupon;
        expect(schema.paths || schema.obj).toBeDefined();
    });
});
