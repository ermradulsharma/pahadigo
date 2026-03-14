import mongoose from 'mongoose';
import Vendor from '../../src/core/Models/Vendor.js';

describe('VendorModel Test Suite', () => {

    it('should fail validation when required fields are missing', async () => {
        const vendor = new Vendor({}); // empty
        let error;
        try {
            await vendor.validate();
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error.errors.user).toBeDefined();
        expect(error.errors.businessName).toBeDefined();
    });

    it('should create a valid vendor with references', async () => {
        const userId = new mongoose.Types.ObjectId();
        const categoryId = new mongoose.Types.ObjectId();

        const vendorData = {
            user: userId,
            businessName: 'Himalayan Adventures',
            category: [{
                _id: categoryId,
                name: 'Trekking',
                slug: 'trekking'
            }],
            bankDetails: {
                accountHolderName: 'Hemant',
                accountNumber: '1234567890',
                ifscCode: 'SBIN0001234',
                bankName: 'SBI',
                cancelledCheque: { url: 'http://test.com/cheque.jpg' }
            },
            documents: {
                aadharCard: [{ url: 'http://test.com/aadhar.jpg' }],
                panCard: { url: 'http://test.com/pan.jpg' },
                businessRegistration: { url: 'http://test.com/reg.jpg' },
                gstRegistration: { url: 'http://test.com/gst.jpg' }
            }
        };

        const vendor = new Vendor(vendorData);
        const savedVendor = await vendor.save();

        expect(savedVendor._id).toBeDefined();
        expect(savedVendor.user.toString()).toBe(userId.toString());
        expect(savedVendor.isApproved).toBe(false); // Should be false by default
    });
});
