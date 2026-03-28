import AdminService from '../../src/core/Services/AdminService.js';
import User from '../../src/core/Models/User.js';
import Vendor from '../../src/core/Models/Vendor.js';
import Booking from '../../src/core/Models/Booking.js';
import Package from '../../src/core/Models/Package.js';
import Policy from '../../src/core/Models/Policy.js';
import Review from '../../src/core/Models/Review.js';
import Banner from '../../src/core/Models/Banner.js';
import Coupon from '../../src/core/Models/Coupon.js';
import Inquiry from '../../src/core/Models/Inquiry.js';
import AuditLog from '../../src/core/Models/AuditLog.js';
import SearchLog from '../../src/core/Models/SearchLog.js';
import mongoose from 'mongoose';
import { RESPONSE_MESSAGES } from '../../src/core/Constants/index.js';
import { jest } from '@jest/globals';

describe('AdminService Robust Tests', () => {

    let req;

    beforeEach(() => {
        req = {
            user: { id: new mongoose.Types.ObjectId().toString() },
            headers: { 'x-forwarded-for': '127.0.0.1', 'user-agent': 'jest' },
            connection: { remoteAddress: '127.0.0.1' }
        };
        jest.clearAllMocks();
    });

    describe('Analytics and Dashboard', () => {
        it('getSystemHealth', async () => {
             const result = await AdminService.getSystemHealth();
             expect(result.status).toBe('healthy');
        });

        it('getDashboardStats', async () => {
             const result = await AdminService.getDashboardStats();
             expect(result.users).toBeDefined();
        });

        it('getFinancialStats', async () => {
             const result = await AdminService.getFinancialStats();
             expect(result.totalRevenue).toBeDefined();
        });

        it('getAnalyticsData', async () => {
             const result = await AdminService.getAnalyticsData('monthly');
             expect(result.revenueData).toBeDefined();
        });
    });

    describe('Users and Vendors', () => {
        it('getAllTravellers', async () => {
             const result = await AdminService.getAllTravellers();
             expect(Array.isArray(result)).toBe(true);
        });

        it('getAllVendors', async () => {
             await User.create({ email: 'v1@test.com', role: 'vendor', password: 'pass', isVerified: true });
             const result = await AdminService.getAllVendors();
             expect(result.length).toBeGreaterThan(0);
        });

        it('createTraveller', async () => {
             const email = 'newtrav@test.com';
             const user = await AdminService.createTraveller({ email, password: 'pass' }, req);
             expect(user.email).toBe(email);
        });

        it('updateVendor', async () => {
             const u = await User.create({ email: 'upd@test.com', role: 'vendor', password: 'pass', isVerified: true });
             const v = await Vendor.create({ user: u._id, businessName: 'Old' });
             const res = await AdminService.updateVendor(v._id, { businessName: 'New' }, req);
             expect(res.businessName).toBe('New');
        });

        it('throws if vendor not found in updateVendor', async () => {
            await expect(AdminService.updateVendor(new mongoose.Types.ObjectId(), { businessName: 'X' })).rejects.toThrow(RESPONSE_MESSAGES.VENDOR.NOT_FOUND);
        });
    });

    describe('AuditLogger', () => {
         it('logs and retrieves actions', async () => {
              const userId = new mongoose.Types.ObjectId();
               await AdminService.logAction(userId, 'CREATE', 'USER', userId, { name: 'Test' }, req);
              
              const result = await AdminService.getAuditLogs({ userId }, 1, 10);
              expect(result.logs.length).toBeGreaterThan(0);
              expect(result.logs[0].action).toBe('CREATE');
         });

         it('supports adminId alias for backwards compatibility', async () => {
              const userId = new mongoose.Types.ObjectId();
              await AuditLog.create({ userId, action: 'DELETE', target: 'RECORDS', targetId: '1' });
              
              const result = await AdminService.getAuditLogs({ adminId: userId }, 1, 10);
              expect(result.logs.length).toBeGreaterThan(0);
         });
    });
});
