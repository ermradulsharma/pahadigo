import AdminService from '../../src/core/Services/AdminService.js';
import User from '../../src/core/Models/User.js';
import Vendor from '../../src/core/Models/Vendor.js';
import Booking from '../../src/core/Models/Booking.js';
import Package from '../../src/core/Models/Package.js';
import Category from '../../src/core/Models/Category.js';
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
            user: { id: new mongoose.Types.ObjectId() },
            headers: { 'x-forwarded-for': '127.0.0.1', 'user-agent': 'jest', get: (key) => null },
            connection: { remoteAddress: '127.0.0.1' }
        };
        jest.clearAllMocks();
    });

    describe('Analytics and Dashboard', () => {
        it('getMapAnalyticsData', async () => {
            const result = await AdminService.getMapAnalyticsData();
            expect(result.userDistribution).toBeDefined();
        });

        it('getCalendarEvents', async () => {
             await Booking.create({ travelDate: new Date(), status: 'confirmed', package: new mongoose.Types.ObjectId(), user: new mongoose.Types.ObjectId() });
             const result = await AdminService.getCalendarEvents(new Date(Date.now() - 100000), new Date(Date.now() + 100000));
             expect(result.length).toBeGreaterThan(0);
             expect(result[0].type).toBe('booking');
        });

        it('getSearchAnalytics', async () => {
             await SearchLog.create({ query: 'test', count: 1, resultsCount: 0 });
             const result = await AdminService.getSearchAnalytics();
             expect(result.topSearches).toBeDefined();
             expect(result.zeroResultSearches).toBeDefined();
        });

        it('getFinancialStats', async () => {
             const result = await AdminService.getFinancialStats();
             expect(result.totalRevenue).toBeDefined();
             expect(result.pendingPayouts).toBeDefined();
             expect(result.refundsProcessed).toBeDefined();
        });

        it('getSystemHealth', async () => {
             const result = await AdminService.getSystemHealth();
             expect(result.errorRate24h).toBeDefined();
             expect(result.activeUsers).toBeDefined();
        });

        it('getDashboardStats', async () => {
             const result = await AdminService.getDashboardStats();
             expect(result.users).toBeDefined();
             expect(result.packages).toBeDefined();
        });

        it('getAnalyticsData', async () => {
             const result = await AdminService.getAnalyticsData('monthly');
             expect(result.revenueData).toBeDefined();
             expect(result.bookingStatus).toBeDefined();
        });
    });

    describe('Users and Vendors', () => {
        it('getAllTravellers', async () => {
             const result = await AdminService.getAllTravellers();
             expect(Array.isArray(result)).toBe(true);
        });

        it('getAllVendors correctly maps profiles', async () => {
             const u = await User.create({ email: 'v1@test.com', role: 'vendor', password: 'pass', isVerified: true });
             await Vendor.create({ user: u._id, businessName: 'biz' });
             const u2 = await User.create({ email: 'v2@test.com', role: 'vendor', password: 'pass', isVerified: true });
             
             const result = await AdminService.getAllVendors();
             expect(result.find(r => r.user._id.toString() === u._id.toString()).hasProfile).toBe(true);
             expect(result.find(r => r._id.toString() === u2._id.toString()).hasProfile).toBe(false);
        });

        it('createTraveller', async () => {
             const email = 'newtrav@test.com';
             const user = await AdminService.createTraveller({ email, password: 'pass' }, req);
             expect(user.email).toBe(email);
             
             await expect(AdminService.createTraveller({ email, password: 'pass' })).rejects.toThrow(RESPONSE_MESSAGES.ERROR.ALREADY_EXISTS);
        });

        it('approveVendor', async () => {
             const v = await Vendor.create({ businessName: 'v', user: new mongoose.Types.ObjectId() });
             const approved = await AdminService.approveVendor(v._id);
             expect(approved.isApproved).toBe(true);
        });

        describe('updateVendor', () => {
             it('throws if neither vendor nor user found', async () => {
                  await expect(AdminService.updateVendor(new mongoose.Types.ObjectId(), {})).rejects.toThrow(RESPONSE_MESSAGES.VENDOR.NOT_FOUND);
             });

             it('updates using user id only (no vendor profile)', async () => {
                  const u = await User.create({ email: 'upd1@test.com', role: 'vendor', password: 'pass', isVerified: true });
                  const res = await AdminService.updateVendor(u._id, { name: 'New Name', socialLinks: { fb: 'fb' }, emergencyContact: { phone: '123' }, status: 'suspended', preferences: { theme: 'dark' } }, req);
                  expect(res.name).toBe('New Name');
             });

             it('updates using vendor profile id', async () => {
                  const u = await User.create({ email: 'upd2@test.com', role: 'vendor', password: 'pass', isVerified: true });
                  const v = await Vendor.create({ user: u._id, businessName: 'Old' });
                  
                  const res = await AdminService.updateVendor(v._id, { 
                      businessName: 'New', 
                      name: 'U Name', 
                      address: { city: 'Test' }, 
                      bankDetails: { bankName: 'SBI' },
                      documents: { panCard: 'test.jpg' }
                  });
                  expect(res.businessName).toBe('New');
             });
             
             it('updates using vendor id but vendor fails dynamically later', async () => {
                  // Cover line 269: if (Object.keys(vendorUpdateData).length > 0) { if (!vendor) throw ...
                  // To trigger this, we need vendorUpdateData to be populated, but vendor to be falsy inside the block.
                  // Wait, earlier if (!vendor && !user) throws. If user exists but vendor doesn't, and vendorUpdateData exists, we hit line 269.
                  const u = await User.create({ email: 'upd3@test.com', role: 'vendor', password: 'pass', isVerified: true });
                  await expect(AdminService.updateVendor(u._id, { businessName: 'Newness' })).rejects.toThrow(RESPONSE_MESSAGES.VENDOR.NOT_FOUND);
             });
        });
    });

    describe('Bookings and Payments', () => {
        it('getAllBookings', async () => {
             const result = await AdminService.getAllBookings();
             expect(Array.isArray(result)).toBe(true);
        });

        it('getPaymentHistory', async () => {
             const pkg = await Package.create({ title: 't', price: 10, vendor: new mongoose.Types.ObjectId() });
             await Booking.create({ package: pkg._id, paymentStatus: 'paid', totalPrice: 100, user: new mongoose.Types.ObjectId(), travelDate: new Date() });
             await Booking.create({ package: pkg._id, refundStatus: 'refunded', totalPrice: 50, user: new mongoose.Types.ObjectId(), travelDate: new Date() });
             await Booking.create({ package: pkg._id, paymentStatus: 'paid', payoutStatus: 'paid', totalPrice: 100, user: new mongoose.Types.ObjectId(), travelDate: new Date() });

             const result = await AdminService.getPaymentHistory();
             expect(result).toEqual(expect.arrayContaining([
                 expect.objectContaining({ type: 'inflow' }),
                 expect.objectContaining({ type: 'outflow', status: 'refunded' }),
                 expect.objectContaining({ type: 'outflow', status: 'paid_out' })
             ]));
        });
    });

    describe('Policies', () => {
        it('getPolicies', async () => {
            await Policy.create({ target: 'vendor', type: 'privacy_policy', content: 'test', lastUpdatedBy: new mongoose.Types.ObjectId() });
            const all = await AdminService.getPolicies();
            const filtered = await AdminService.getPolicies('vendor');
            expect(all.length).toBeGreaterThan(0);
            expect(filtered.length).toBeGreaterThan(0);
        });

        it('getPolicy', async () => {
            const p = await AdminService.getPolicy('vendor', 'privacy_policy');
            expect(p).toBeDefined();
        });

        it('updatePolicy', async () => {
            const p = await AdminService.updatePolicy('vendor', 'privacy_policy', '<p>Test</p>', new mongoose.Types.ObjectId());
            expect(p.content).toContain('Test');
        });
    });

    describe('Services', () => {
         it('getAllServices', async () => {
              const vendorId = new mongoose.Types.ObjectId();
              await Package.create({ vendor: vendorId, title: 'Pkg', price: 10, hotel: [{ _id: new mongoose.Types.ObjectId(), name: 'H', categorySlug: 'hotel', title: 'H', description: 'desc', location: { address: 'add' } }] });
              const services = await AdminService.getAllServices();
              expect(services.length).toBeGreaterThan(0);
              expect(services[0].serviceType).toBe('hotel');
         });

         it('toggleServiceStatus', async () => {
              const vendorId = new mongoose.Types.ObjectId();
              const serviceId = new mongoose.Types.ObjectId();
              await Package.create({ vendor: vendorId, title: 'Pkg', price: 10, hotel: [{ _id: serviceId, name: 'H', categorySlug: 'hotel', isActive: true, title: 'H', description: 'desc', location: { address: 'add' } }] });
              
              const res = await AdminService.toggleServiceStatus(vendorId, 'hotel', serviceId.toString(), false, req);
              expect(res.isActive).toBe(false);

              await expect(AdminService.toggleServiceStatus(new mongoose.Types.ObjectId(), 'hotel', serviceId.toString(), false)).rejects.toThrow(RESPONSE_MESSAGES.PACKAGE.NOT_FOUND);
              
              const vendorId2 = new mongoose.Types.ObjectId();
              await Package.create({ vendor: vendorId2, title: 'Pkg2', price: 10 });
              await expect(AdminService.toggleServiceStatus(vendorId2, 'invalidType', serviceId.toString(), false)).rejects.toThrow();

              const vendorId3 = new mongoose.Types.ObjectId();
              await Package.create({ vendor: vendorId3, title: 'Pkg3', price: 10, hotel: [] });
              await expect(AdminService.toggleServiceStatus(vendorId3, 'hotel', serviceId.toString(), false)).rejects.toThrow(RESPONSE_MESSAGES.ITEM.NOT_FOUND);
         });
    });

    describe('Reviews', () => {
        it('getAllReviews', async () => {
            const r = await AdminService.getAllReviews();
            expect(Array.isArray(r)).toBe(true);
        });

        it('toggleReviewVisibility', async () => {
            const r = await Review.create({ user: new mongoose.Types.ObjectId(), vendor: new mongoose.Types.ObjectId(), targetId: new mongoose.Types.ObjectId(), onModel: 'Vendor', rating: 5, review: 't' });
            const toggled = await AdminService.toggleReviewVisibility(r._id, false, req);
            expect(toggled.isVisible).toBe(false);
        });

        it('deleteReview', async () => {
            const r = await Review.create({ user: new mongoose.Types.ObjectId(), vendor: new mongoose.Types.ObjectId(), targetId: new mongoose.Types.ObjectId(), onModel: 'Vendor', rating: 5, review: 't' });
            await AdminService.deleteReview(r._id, req);
            const found = await Review.findById(r._id);
            expect(found).toBeNull();
        });
    });

    describe('Banners', () => {
         it('creates, gets, updates, and deletes banner', async () => {
              const b = await AdminService.createBanner({ title: 'T', imageUrl: 'url' }, req);
              expect(b.title).toBe('T');

              const list = await AdminService.getBanners();
              expect(list.length).toBeGreaterThan(0);

              const upd = await AdminService.updateBanner(b._id, { title: 'T2' }, req);
              expect(upd.title).toBe('T2');

              await AdminService.deleteBanner(b._id, req);
              const found = await Banner.findById(b._id);
              expect(found).toBeNull();
         });
    });

    describe('Coupons', () => {
         it('creates, gets, updates, and deletes coupon', async () => {
              const c = await AdminService.createCoupon({ code: 'CODE10', discountType: 'percentage', value: 10, expiryDate: new Date() }, req);
              expect(c.code).toBe('CODE10');

              const list = await AdminService.getCoupons();
              expect(list.length).toBeGreaterThan(0);

              const upd = await AdminService.updateCoupon(c._id, { value: 20 }, req);
              expect(upd.value).toBe(20);

              await AdminService.deleteCoupon(c._id, req);
              const found = await Coupon.findById(c._id);
              expect(found).toBeNull();
         });
    });

    describe('Inquiries', () => {
         it('submit, gets, updates, and deletes inquiry', async () => {
              const c = await AdminService.submitInquiry({ name: 'N', email: 'e@e.com', subject: 's', message: 'm' });
              expect(c.name).toBe('N');

              const list = await AdminService.getInquiries();
              expect(list.length).toBeGreaterThan(0);

              const upd = await AdminService.updateInquiry(c._id, { status: 'resolved' });
              expect(upd.status).toBe('resolved');

              await AdminService.deleteInquiry(c._id);
              const found = await Inquiry.findById(c._id);
              expect(found).toBeNull();
         });
    });

    describe('AuditLogger', () => {
         it('should catch error without throwing if save fails', async () => {
              jest.spyOn(AuditLog.prototype, 'save').mockRejectedValueOnce(new Error('fail'));
              // Shouldn't throw
              await AdminService.logAction(new mongoose.Types.ObjectId(), 'TEST', 'TEST', 'TEST', {});
         });
         
         it('getAuditLogs', async () => {
              const adminId = new mongoose.Types.ObjectId();
              await AuditLog.create({ adminId, action: 'CREATE', target: 'USER', targetId: '123' });
              const result = await AdminService.getAuditLogs({ adminId, action: 'CREATE', target: 'USER', startDate: new Date(Date.now() - 100000) }, 1, 10);
              expect(result.logs.length).toBeGreaterThan(0);
         });
    });
});
