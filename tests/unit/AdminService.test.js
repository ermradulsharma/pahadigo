import AdminService from '../../src/core/Services/AdminService.js';
import User from '../../src/core/Models/User.js';
import Vendor from '../../src/core/Models/Vendor.js';
import AuditLog from '../../src/core/Models/AuditLog.js';
import mongoose from 'mongoose';

describe('AdminService Test Suite', () => {

    it('should create a traveller user directly', async () => {
        const u = await AdminService.createTraveller({
            name: 'Test Traveller',
            email: 'traveller@test.com',
            password: 'password123',
            phone: '1234567890'
        });
        expect(u.role).toBe('traveller');
        expect(u.name).toBe('Test Traveller');
    });

    it('should properly log admin actions to AuditLog', async () => {
        const adminId = new mongoose.Types.ObjectId();
        await AdminService.logAction(
            adminId,
            'DELETE',
            'VENDOR',
            'vendor123',
            { reason: 'Fraud' }
        );

        const logs = await AdminService.getAuditLogs({ action: 'DELETE' }, 1, 10);
        expect(logs.logs.length).toBeGreaterThan(0);
        expect(logs.logs[0].target).toBe('VENDOR');
        expect(logs.logs[0].targetId).toBe('vendor123');
    });

    it('should return system health metrics', async () => {
        const health = await AdminService.getSystemHealth();
        expect(health).toHaveProperty('activeUsers');
        expect(health).toHaveProperty('errorRate24h');
    });

    it('should approve a vendor', async () => {
        const user = await User.create({ email: 'vend@test.com', role: 'vendor', password: 'Password123' });
        const vendor = await Vendor.create({
            user: user._id,
            businessName: 'Test Vendor Co',
            category: [{ name: 'Hotel', slug: 'hotel' }],
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
            },
            verificationStatus: 'pending'
        });

        const approved = await AdminService.approveVendor(vendor._id);
        expect(approved.verificationStatus).toBe('approved');
    });
});
