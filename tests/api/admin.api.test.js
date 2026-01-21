const AdminController = require('../../src/controllers/AdminController');
const Vendor = require('../../src/models/Vendor');
const mongoose = require('mongoose');

describe('Admin API Integration', () => {
    it('should fetch stats for admin user', async () => {
        const req = {
            user: { role: 'admin' }
        };

        const response = await AdminController.getStats(req);
        expect(response.status).toBe(200);
        expect(response.data.users).toBeDefined();
    });

    it('should deny stats for regular user', async () => {
        const req = {
            user: { role: 'user' }
        };

        const response = await AdminController.getStats(req);
        expect(response.status).toBe(403);
        expect(response.data.error).toBe('Admin access required');
    });

    it('should approve a vendor', async () => {
        const vendor = await Vendor.create({
            user: new mongoose.Types.ObjectId(),
            businessName: 'Unapproved Vendor',
            category: 'Hotel',
            isApproved: false
        });

        const req = {
            user: { role: 'admin' },
            json: async () => ({ vendorId: vendor._id })
        };

        const response = await AdminController.approveVendor(req);
        expect(response.status).toBe(200);
        expect(response.data.message).toBe('Approved');

        const updated = await Vendor.findById(vendor._id);
        expect(updated.isApproved).toBe(true);
    });
});
