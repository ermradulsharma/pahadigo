import mongoose from 'mongoose';
import Coupon from '../../src/core/Models/Coupon.js';

describe('CouponModel Test Suite', () => {
    it('should require code, discountType, value, and expiryDate', async () => {
        const coupon = new Coupon({});
        let error;
        try { await coupon.validate(); } catch (e) { error = e; }

        expect(error).toBeDefined();
        expect(error.errors.code).toBeDefined();
        expect(error.errors.discountType).toBeDefined();
        expect(error.errors.value).toBeDefined();
        expect(error.errors.expiryDate).toBeDefined();
    });

    it('should enforce enum restrictions on discountType', async () => {
        const coupon = new Coupon({
            code: 'SAVE10',
            discountType: 'invalid_type',
            value: 10,
            expiryDate: new Date()
        });

        let error;
        try { await coupon.validate(); } catch (e) { error = e; }
        expect(error.errors.discountType).toBeDefined();
    });

    it('should convert code to uppercase', async () => {
        const coupon = new Coupon({
            code: 'save10',
            discountType: 'percentage',
            value: 10,
            expiryDate: new Date()
        });

        const saved = await coupon.save();
        expect(saved.code).toBe('SAVE10');
    });
});
