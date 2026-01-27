import AdminController from '../../src/controllers/AdminController.js';
import Vendor from '../../src/models/Vendor.js';
import mongoose from 'mongoose';
import { USER_ROLES } from '../../src/constants/index.js';

describe('Admin API Integration', () => {
    it('should fetch stats for admin user', async () => {
        const req = {
            user: { role: USER_ROLES.ADMIN }
        };

        const response = await AdminController.getStats(req);
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.data.stats).toBeDefined();
        expect(data.data.stats.users).toBeDefined();
    });

    it('should deny stats for regular user', async () => {
        const req = {
            user: { role: USER_ROLES.TRAVELLER }
        };

        const response = await AdminController.getStats(req);
        expect(response.status).toBe(403);
        const data = await response.json();
        expect(data.message).toBe('Access denied. Admin only.');
    });

    it('should approve a vendor', async () => {
        const vendor = await Vendor.create({
            user: new mongoose.Types.ObjectId(),
            businessName: 'Unapproved Vendor',
            category: ['Hotel'],
            isApproved: false,
            documents: {
                aadharCard: [{ url: 'http://test.com/aadhar.jpg' }],
                panCard: { url: 'http://test.com/pan.jpg' },
                businessRegistration: { url: 'http://test.com/biz.jpg' },
                gstRegistration: { url: 'http://test.com/gst.jpg' }
            }
        });

        const req = {
            user: { role: USER_ROLES.ADMIN },
            jsonBody: { vendorId: vendor._id }
        };

        const response = await AdminController.approveVendor(req);
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.message).toBe('Vendor status updated successfully');

        const updated = await Vendor.findById(vendor._id);
        expect(updated.isApproved).toBe(true);
    });
});
