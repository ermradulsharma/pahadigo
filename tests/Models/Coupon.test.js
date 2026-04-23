import Coupon from '@/models/Coupon.js';
import { cleanDatabase } from '../Helpers/testUtils.js';

describe('Industry Standard: Coupon Data Structure', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    it('[Success] should create a valid coupon', async () => {
        const couponData = {
            code: 'WELCOME10',
            discountType: 'percentage',
            value: 10,
            expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24)
        };
        const coupon = await Coupon.create(couponData);
        expect(coupon.code).toBe('WELCOME10');
        expect(coupon.isActive).toBe(true);
    });

    it('[Failure] should fail if required fields are missing', async () => {
        const coupon = new Coupon({ code: 'FAIL' });
        let err;
        try {
            await coupon.validate();
        } catch (e) {
            err = e;
        }
        expect(err.errors.discountType).toBeDefined();
        expect(err.errors.value).toBeDefined();
        expect(err.errors.expiryDate).toBeDefined();
    });

    it('[Failure] should fail if discountType is invalid', async () => {
        const coupon = new Coupon({ discountType: 'invalid' });
        let err;
        try {
            await coupon.validate();
        } catch (e) {
            err = e;
        }
        expect(err.errors.discountType).toBeDefined();
    });
});
