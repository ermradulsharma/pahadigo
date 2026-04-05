import mongoose from 'mongoose';
import VendorClosure from '../../../src/core/Models/VendorClosure.js';

describe('VendorClosureModel Test Suite', () => {
    it('should validate required fields', async () => {
        const closure = new VendorClosure({});
        let error;
        try {
            await closure.validate();
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error.errors.vendor).toBeDefined();
        expect(error.errors.startDate).toBeDefined();
        expect(error.errors.endDate).toBeDefined();
    });

    it('should create a valid closure record', async () => {
        const vendorId = new mongoose.Types.ObjectId();
        const userId = new mongoose.Types.ObjectId();
        const now = new Date();
        const closureData = {
            vendor: vendorId,
            user: userId,
            startDate: new Date(now.getTime()), // Future
            endDate: new Date(now.getTime() + 86400000),
            reason: 'Renovation',
            isActive: true
        };

        const closure = new VendorClosure(closureData);
        const saved = await closure.save();
        
        expect(saved._id).toBeDefined();
        expect(saved.vendor.toString()).toBe(vendorId.toString());
        expect(saved.isActive).toBe(true);
    });
});
