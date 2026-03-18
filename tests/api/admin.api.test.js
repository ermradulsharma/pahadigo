import AdminController from '../../src/core/Http/Controllers/AdminController.js';
import Vendor from '../../src/core/Models/Vendor.js';
import VerifiedIdentity from '../../src/core/Models/VerifiedIdentity.js';
import AdminService from '../../src/core/Services/AdminService.js';
import PackageService from '../../src/core/Services/PackageService.js';
import BookingService from '../../src/core/Services/BookingService.js';
import OCRService from '../../src/core/Services/OCRService.js';
import mongoose from 'mongoose';
import { USER_ROLES } from '../../src/core/Constants/index.js';
import { jest } from '@jest/globals';

describe('Admin API Integration (Controller Layer)', () => {
    let mockReq;
    beforeEach(() => {
        mockReq = {
            jsonBody: {},
            user: { role: USER_ROLES.ADMIN },
            url: 'http://localhost/admin?period=monthly',
            json: async function() { return this.jsonBody; }
        };
        jest.clearAllMocks();
    });

    // 1. Stats and Basic entity getters
    describe('Getters: getStats, getBookings, getVendors, getTravellers', () => {
        it('getStats blocks non-admins', async () => {
            mockReq.user = { role: USER_ROLES.TRAVELLER };
            const res = await AdminController.getStats(mockReq);
            expect(res.status).toBe(403);
        });

        it('getStats succeeds for admins', async () => {
            jest.spyOn(AdminService, 'getDashboardStats').mockResolvedValue({ users: 10 });
            const res = await AdminController.getStats(mockReq);
            expect(res.status).toBe(200);
        });

        it('getStats handles error', async () => {
            jest.spyOn(AdminService, 'getDashboardStats').mockRejectedValue(new Error('fail'));
            const res = await AdminController.getStats(mockReq);
            expect(res.status).toBe(500);
        });

        it('getBookings succeeds', async () => {
            jest.spyOn(AdminService, 'getAllBookings').mockResolvedValue([{ _id: '1' }]);
            const res = await AdminController.getBookings(mockReq);
            expect(res.status).toBe(200);
        });

        it('getBookings handles error', async () => {
             jest.spyOn(AdminService, 'getAllBookings').mockRejectedValue(new Error('f'));
             const res = await AdminController.getBookings(mockReq);
             expect(res.status).toBe(500);
        });

        it('getVendors succeeds', async () => {
            jest.spyOn(AdminService, 'getAllVendors').mockResolvedValue([{ _id: '1' }]);
            const res = await AdminController.getVendors(mockReq);
            expect(res.status).toBe(200);
        });

        it('getVendors handles error', async () => {
            jest.spyOn(AdminService, 'getAllVendors').mockRejectedValue(new Error('f'));
            const res = await AdminController.getVendors(mockReq);
            expect(res.status).toBe(500);
        });

        it('getTravellers succeeds', async () => {
            jest.spyOn(AdminService, 'getAllTravellers').mockResolvedValue([{ _id: '1' }]);
            const res = await AdminController.getTravellers(mockReq);
            expect(res.status).toBe(200);
        });

        it('getTravellers handles error', async () => {
             jest.spyOn(AdminService, 'getAllTravellers').mockRejectedValue(new Error('f'));
             const res = await AdminController.getTravellers(mockReq);
             expect(res.status).toBe(500);
        });
    });

    // 2. Creator methods
    describe('createTraveller', () => {
        it('requires necessary fields', async () => {
             mockReq.jsonBody = {};
             const res = await AdminController.createTraveller(mockReq);
             expect(res.status).toBe(400);
        });

        it('succeeds with fields', async () => {
             mockReq.jsonBody = { name: 'n', email: 'e', password: 'p' };
             jest.spyOn(AdminService, 'createTraveller').mockResolvedValue({ _id: '1' });
             const res = await AdminController.createTraveller(mockReq);
             expect(res.status).toBe(201);
        });

        it('handles error', async () => {
             mockReq.jsonBody = { name: 'n', email: 'e', password: 'p' };
             jest.spyOn(AdminService, 'createTraveller').mockRejectedValue(new Error('f'));
             const res = await AdminController.createTraveller(mockReq);
             expect(res.status).toBe(500);
        });
    });

    // 3. Vendor methods
    describe('Vendor Updates', () => {
        it('approveVendor requires id', async () => {
             const res = await AdminController.approveVendor({ jsonBody: {} });
             expect(res.status).toBe(400);
        });

        it('approveVendor sets verified status', async () => {
             jest.spyOn(Vendor, 'findByIdAndUpdate').mockResolvedValue({});
             const res = await AdminController.approveVendor({ jsonBody: { vendorId: '1', status: 'verified' } });
             expect(res.status).toBe(200);
             expect(Vendor.findByIdAndUpdate).toHaveBeenCalledWith('1', { isApproved: true });
        });

        it('approveVendor sets rejected status', async () => {
            jest.spyOn(Vendor, 'findByIdAndUpdate').mockResolvedValue({});
            const res = await AdminController.approveVendor({ jsonBody: { vendorId: '1', status: 'rejected' } });
            expect(res.status).toBe(200);
            expect(Vendor.findByIdAndUpdate).toHaveBeenCalledWith('1', { isApproved: false });
        });

        it('approveVendor sets default status', async () => {
            jest.spyOn(Vendor, 'findByIdAndUpdate').mockResolvedValue({});
            const res = await AdminController.approveVendor({ jsonBody: { vendorId: '1' } });
            expect(res.status).toBe(200);
            expect(Vendor.findByIdAndUpdate).toHaveBeenCalledWith('1', { isApproved: true });
        });

        it('approveVendor catches errors', async () => {
            jest.spyOn(Vendor, 'findByIdAndUpdate').mockRejectedValue(new Error('fail'));
            const res = await AdminController.approveVendor({ jsonBody: { vendorId: '1' } });
            expect(res.status).toBe(500);
        });

        it('updateVendor requires id', async () => {
             const res = await AdminController.updateVendor({ jsonBody: {} }, { params: {} });
             expect(res.status).toBe(400);
        });

        it('updateVendor succeeds', async () => {
            jest.spyOn(AdminService, 'updateVendor').mockResolvedValue({ _id: '1' });
            const res = await AdminController.updateVendor({ jsonBody: {} }, { params: { id: '1' } });
            expect(res.status).toBe(200);
        });

        it('updateVendor handles errors', async () => {
             jest.spyOn(AdminService, 'updateVendor').mockRejectedValue(new Error('fail'));
             const res = await AdminController.updateVendor({ jsonBody: {} }, { params: { id: '1' } });
             expect(res.status).toBe(500);
        });
    });

    describe('Vendor Document & OCR', () => {
         it('verifyDocument requires fields', async () => {
             const res = await AdminController.verifyDocument({ jsonBody: {} });
             expect(res.status).toBe(400);
         });

         it('verifyDocument fails if vendor not found', async () => {
              mockReq.jsonBody = { vendorId: 'v1', documentField: 'f1', status: 's1' };
              jest.spyOn(Vendor, 'findById').mockResolvedValue(null);
              const res = await AdminController.verifyDocument(mockReq);
              expect(res.status).toBe(404);
         });

         it('verifyDocument fails if doc not found', async () => {
              mockReq.jsonBody = { vendorId: 'v1', documentField: 'f1', status: 's1' };
              jest.spyOn(Vendor, 'findById').mockResolvedValue({ documents: {} });
              const res = await AdminController.verifyDocument(mockReq);
              expect(res.status).toBe(404);
         });

         it('verifyDocument array doc missing index', async () => {
              mockReq.jsonBody = { vendorId: 'v1', documentField: 'f1', status: 's1' };
              jest.spyOn(Vendor, 'findById').mockResolvedValue({ documents: { f1: [{}] } });
              const res = await AdminController.verifyDocument(mockReq);
              expect(res.status).toBe(400);
         });
         
         it('verifyDocument array doc invalid index', async () => {
              mockReq.jsonBody = { vendorId: 'v1', documentField: 'f1', status: 's1', index: 99 };
              jest.spyOn(Vendor, 'findById').mockResolvedValue({ documents: { f1: [{}] } });
              const res = await AdminController.verifyDocument(mockReq);
              expect(res.status).toBe(404);
         });

         it('verifyDocument array doc succeeds', async () => {
              const vendor = { documents: { f1: [{}] }, save: jest.fn(), markModified: jest.fn() };
              mockReq.jsonBody = { vendorId: 'v1', documentField: 'f1', status: 'rejected', index: 0, reason: 'Bad' };
              jest.spyOn(Vendor, 'findById').mockResolvedValue(vendor);
              const res = await AdminController.verifyDocument(mockReq);
              expect(res.status).toBe(200);
              expect(vendor.documents.f1[0].status).toBe('rejected');
         });

         it('verifyDocument single doc succeeds', async () => {
              const vendor = { documents: { f1: {} }, save: jest.fn(), markModified: jest.fn() };
              mockReq.jsonBody = { vendorId: 'v1', documentField: 'f1', status: 'verified' };
              jest.spyOn(Vendor, 'findById').mockResolvedValue(vendor);
              const res = await AdminController.verifyDocument(mockReq);
              expect(res.status).toBe(200);
              expect(vendor.documents.f1.status).toBe('verified');
         });

         it('verifyDocument OCR requires fields', async () => {
             const res = await AdminController.verifyDocumentOCR({ jsonBody: {} });
             expect(res.status).toBe(400);
         });

         it('verifyDocument OCR vendor not found', async () => {
              mockReq.jsonBody = { vendorId: '1', documentField: 'f' };
              jest.spyOn(Vendor, 'findById').mockResolvedValue(null);
              const res = await AdminController.verifyDocumentOCR(mockReq);
              expect(res.status).toBe(404);
         });

         it('verifyDocument OCR doc URL missing', async () => {
              mockReq.jsonBody = { vendorId: '1', documentField: 'f' };
              jest.spyOn(Vendor, 'findById').mockResolvedValue({ documents: { f: {} } });
              const res = await AdminController.verifyDocumentOCR(mockReq);
              expect(res.status).toBe(404);
         });

         it('verifyDocument OCR doc index missing for array', async () => {
              mockReq.jsonBody = { vendorId: '1', documentField: 'f' };
              jest.spyOn(Vendor, 'findById').mockResolvedValue({ documents: { f: [{}] } });
              const res = await AdminController.verifyDocumentOCR(mockReq);
              expect(res.status).toBe(400);
         });

         it('verifyDocument OCR invalid URL', async () => {
              mockReq.jsonBody = { vendorId: '1', documentField: 'f' };
              jest.spyOn(Vendor, 'findById').mockResolvedValue({ documents: { f: { url: 'http://evil.com/a.jpg' } } });
              const res = await AdminController.verifyDocumentOCR(mockReq);
              expect(res.status).toBe(400); // blocked SSRF
         });

         it('verifyDocument OCR handles fetch error', async () => {
             mockReq.jsonBody = { vendorId: '1', documentField: 'f' };
             jest.spyOn(Vendor, 'findById').mockResolvedValue({ documents: { f: { url: 'http://res.cloudinary.com/a.jpg' } } });
             global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });
             const res = await AdminController.verifyDocumentOCR(mockReq);
             expect(res.status).toBe(400);
         });

         it('verifyDocument OCR handles invalid image size', async () => {
              mockReq.jsonBody = { vendorId: '1', documentField: 'f' };
              jest.spyOn(Vendor, 'findById').mockResolvedValue({ documents: { f: { url: 'http://res.cloudinary.com/a.jpg' } } });
              global.fetch = jest.fn().mockResolvedValue({ ok: true, arrayBuffer: async () => new ArrayBuffer(50) });
              const res = await AdminController.verifyDocumentOCR(mockReq);
              expect(res.status).toBe(400);
         });

         it('verifyDocument OCR handles OCR failure', async () => {
               mockReq.jsonBody = { vendorId: '1', documentField: 'f' };
               jest.spyOn(Vendor, 'findById').mockResolvedValue({ documents: { f: { url: 'http://res.cloudinary.com/a.jpg' } } });
               global.fetch = jest.fn().mockResolvedValue({ ok: true, arrayBuffer: async () => new ArrayBuffer(200) });
               jest.spyOn(OCRService, 'processDocument').mockResolvedValue({ error: true });
               const res = await AdminController.verifyDocumentOCR(mockReq);
               expect(res.status).toBe(500);
         });

         it('verifyDocument OCR full success array', async () => {
               const vendor = { documents: { f: [{ url: 'http://res.cloudinary.com/upload/a.jpg' }] }, save: jest.fn(), markModified: jest.fn() };
               mockReq.jsonBody = { vendorId: '1', documentField: 'f', index: 0 };
               jest.spyOn(Vendor, 'findById').mockResolvedValue(vendor);
               global.fetch = jest.fn().mockResolvedValue({ ok: true, arrayBuffer: async () => new ArrayBuffer(200) });
               jest.spyOn(OCRService, 'processDocument').mockResolvedValue({ idType: 'PAN', identifiedId: '123', name: 'Joe', text: 'raw' });
               jest.spyOn(VerifiedIdentity, 'findOneAndUpdate').mockResolvedValue({});
               
               const res = await AdminController.verifyDocumentOCR(mockReq);
               expect(res.status).toBe(200);
               expect(vendor.documents.f[0].status).toBe('verified');
         });

         it('verifyDocument OCR server error trap', async () => {
               jest.spyOn(Vendor, 'findById').mockRejectedValue(new Error('fail'));
               const res = await AdminController.verifyDocumentOCR({ jsonBody: { vendorId: '1', documentField: '1' } });
               expect(res.status).toBe(500);
         });
         
         it('verifyDocument server error trap', async () => {
               jest.spyOn(Vendor, 'findById').mockRejectedValue(new Error('fail'));
               const res = await AdminController.verifyDocument({ jsonBody: { vendorId: '1', documentField: '1', status: '1' } });
               expect(res.status).toBe(500);
         });
    });

    // 4. Packages and Services
    describe('Packages and Services', () => {
         it('addPackageOnBehalf requires vendorId', async () => {
             const res = await AdminController.addPackageOnBehalf({ jsonBody: {} });
             expect(res.status).toBe(400);
         });

         it('addPackageOnBehalf succeeds', async () => {
             mockReq.jsonBody = { vendorId: '1', title: 'T' };
             jest.spyOn(PackageService, 'createPackage').mockResolvedValue({ _id: 'p1' });
             const res = await AdminController.addPackageOnBehalf(mockReq);
             expect(res.status).toBe(201);
         });

         it('addPackageOnBehalf handles errors', async () => {
             mockReq.jsonBody = { vendorId: '1', title: 'T' };
             jest.spyOn(PackageService, 'createPackage').mockRejectedValue(new Error('fail'));
             const res = await AdminController.addPackageOnBehalf(mockReq);
             expect(res.status).toBe(500);
         });

         it('getPackages succeeds', async () => {
             jest.spyOn(AdminService, 'getAllServices').mockResolvedValue([]);
             const res = await AdminController.getPackages(mockReq);
             expect(res.status).toBe(200);
         });
         
         it('getPackages handles errors', async () => {
             jest.spyOn(AdminService, 'getAllServices').mockRejectedValue(new Error('fail'));
             const res = await AdminController.getPackages(mockReq);
             expect(res.status).toBe(500);
         });

         it('updateServiceStatus requires fields', async () => {
              const res = await AdminController.updateServiceStatus({ jsonBody: {} });
              expect(res.status).toBe(400);
         });

         it('updateServiceStatus succeeds', async () => {
               mockReq.jsonBody = { vendorId: '1', serviceType: 'hotel', serviceId: '2', status: 'active' };
               jest.spyOn(AdminService, 'toggleServiceStatus').mockResolvedValue({});
               const res = await AdminController.updateServiceStatus(mockReq);
               expect(res.status).toBe(200);
         });

         it('updateServiceStatus handles errors', async () => {
               mockReq.jsonBody = { vendorId: '1', serviceType: 'hotel', serviceId: '2', status: 'active' };
               jest.spyOn(AdminService, 'toggleServiceStatus').mockRejectedValue(new Error('fail'));
               const res = await AdminController.updateServiceStatus(mockReq);
               expect(res.status).toBe(500);
         });
    });

    // 5. Booking Payout & Refund
    describe('Booking actions', () => {
        it('markPayout requires bookingId', async () => {
             const res = await AdminController.markPayout({ jsonBody: {} });
             expect(res.status).toBe(400);
        });

        it('markPayout succeeds', async () => {
             mockReq.jsonBody = { bookingId: '1' };
             jest.spyOn(BookingService, 'markPayout').mockResolvedValue(true);
             const res = await AdminController.markPayout(mockReq);
             expect(res.status).toBe(200);
        });

        it('markPayout handles NotFound', async () => {
            mockReq.jsonBody = { bookingId: '1' };
            jest.spyOn(BookingService, 'markPayout').mockRejectedValue(new Error('Booking not found'));
            const res = await AdminController.markPayout(mockReq);
            expect(res.status).toBe(404);
        });

        it('markPayout handles internal errors', async () => {
             mockReq.jsonBody = { bookingId: '1' };
             jest.spyOn(BookingService, 'markPayout').mockRejectedValue(new Error('other err'));
             const res = await AdminController.markPayout(mockReq);
             expect(res.status).toBe(500);
        });

        it('refundBooking requires bookingId', async () => {
             const res = await AdminController.refundBooking({ jsonBody: {} });
             expect(res.status).toBe(400);
        });

        it('refundBooking succeeds', async () => {
             mockReq.jsonBody = { bookingId: '1' };
             jest.spyOn(BookingService, 'processRefund').mockResolvedValue(true);
             const res = await AdminController.refundBooking(mockReq);
             expect(res.status).toBe(200);
        });

        it('refundBooking handles errors', async () => {
            mockReq.jsonBody = { bookingId: '1' };
            jest.spyOn(BookingService, 'processRefund').mockRejectedValue(new Error('Booking not found'));
            const res = await AdminController.refundBooking(mockReq);
            expect(res.status).toBe(404);
        });
        
        it('getPaymentHistory succeeds', async () => {
            jest.spyOn(AdminService, 'getPaymentHistory').mockResolvedValue([]);
            const res = await AdminController.getPaymentHistory(mockReq);
            expect(res.status).toBe(200);
        });

        it('getPaymentHistory handles error', async () => {
             jest.spyOn(AdminService, 'getPaymentHistory').mockRejectedValue(new Error('fail'));
             const res = await AdminController.getPaymentHistory(mockReq);
             expect(res.status).toBe(500);
        });
    });

    // 6. Reviews
    describe('Reviews', () => {
         it('getReviews succeeds', async () => {
              jest.spyOn(AdminService, 'getAllReviews').mockResolvedValue([]);
              const res = await AdminController.getReviews(mockReq);
              expect(res.status).toBe(200);
         });

         it('getReviews catches error', async () => {
               jest.spyOn(AdminService, 'getAllReviews').mockRejectedValue(new Error('fail'));
               const res = await AdminController.getReviews(mockReq);
               expect(res.status).toBe(500);
         });

         it('updateReviewStatus requires fields', async () => {
              const res = await AdminController.updateReviewStatus({ jsonBody: {} });
              expect(res.status).toBe(400);
         });

         it('updateReviewStatus succeeds', async () => {
              mockReq.jsonBody = { reviewId: '1', isVisible: true };
              jest.spyOn(AdminService, 'toggleReviewVisibility').mockResolvedValue({});
              const res = await AdminController.updateReviewStatus(mockReq);
              expect(res.status).toBe(200);
         });

         it('updateReviewStatus catches error', async () => {
               mockReq.jsonBody = { reviewId: '1', isVisible: true };
               jest.spyOn(AdminService, 'toggleReviewVisibility').mockRejectedValue(new Error('fail'));
               const res = await AdminController.updateReviewStatus(mockReq);
               expect(res.status).toBe(500);
         });

         it('deleteReview requires id', async () => {
              const res = await AdminController.deleteReview(mockReq, { params: {} });
              expect(res.status).toBe(400);
         });

         it('deleteReview succeeds', async () => {
              jest.spyOn(AdminService, 'deleteReview').mockResolvedValue(true);
              const res = await AdminController.deleteReview(mockReq, { params: { id: '1' } });
              expect(res.status).toBe(200);
         });

         it('deleteReview handles error', async () => {
               jest.spyOn(AdminService, 'deleteReview').mockRejectedValue(new Error('fail'));
               const res = await AdminController.deleteReview(mockReq, { params: { id: '1' } });
               expect(res.status).toBe(500);
         });
    });

    // 7. Banners
    describe('Banners', () => {
         it('createBanner requires imageUrl', async () => {
             const res = await AdminController.createBanner({ jsonBody: {} });
             expect(res.status).toBe(400);
         });

         it('createBanner succeeds', async () => {
              mockReq.jsonBody = { imageUrl: 'url' };
              jest.spyOn(AdminService, 'createBanner').mockResolvedValue({});
              const res = await AdminController.createBanner(mockReq);
              expect(res.status).toBe(201);
         });
         
         it('createBanner fails', async () => {
              mockReq.jsonBody = { imageUrl: 'url' };
              jest.spyOn(AdminService, 'createBanner').mockRejectedValue(new Error('f'));
              const res = await AdminController.createBanner(mockReq);
              expect(res.status).toBe(500);
         });

         it('getBanners succeeds', async () => {
              jest.spyOn(AdminService, 'getBanners').mockResolvedValue([]);
              const res = await AdminController.getBanners(mockReq);
              expect(res.status).toBe(200);
         });
         
         it('getBanners fails', async () => {
              jest.spyOn(AdminService, 'getBanners').mockRejectedValue(new Error('f'));
              const res = await AdminController.getBanners(mockReq);
              expect(res.status).toBe(500);
         });

         it('updateBanner succeeds', async () => {
              jest.spyOn(AdminService, 'updateBanner').mockResolvedValue({});
              const res = await AdminController.updateBanner(mockReq, { params: { id: '1'} });
              expect(res.status).toBe(200);
         });
         
         it('updateBanner fails', async () => {
              jest.spyOn(AdminService, 'updateBanner').mockRejectedValue(new Error('f'));
              const res = await AdminController.updateBanner(mockReq, { params: { id: '1'} });
              expect(res.status).toBe(500);
         });

         it('deleteBanner succeeds', async () => {
              jest.spyOn(AdminService, 'deleteBanner').mockResolvedValue(true);
              const res = await AdminController.deleteBanner(mockReq, { params: { id: '1' } });
              expect(res.status).toBe(200);
         });
         
         it('deleteBanner fails', async () => {
              jest.spyOn(AdminService, 'deleteBanner').mockRejectedValue(new Error('f'));
              const res = await AdminController.deleteBanner(mockReq, { params: { id: '1' } });
              expect(res.status).toBe(500);
         });
    });

    // 8. Coupons
    describe('Coupons', () => {
         it('createCoupon requires fields', async () => {
             const res = await AdminController.createCoupon({ jsonBody: {} });
             expect(res.status).toBe(400);
         });

         it('createCoupon succeeds', async () => {
              mockReq.jsonBody = { code: '1', discountType: 'fixed', value: 10, expiryDate: new Date() };
              jest.spyOn(AdminService, 'createCoupon').mockResolvedValue({});
              const res = await AdminController.createCoupon(mockReq);
              expect(res.status).toBe(201);
         });

         it('createCoupon handles duplicate', async () => {
               mockReq.jsonBody = { code: '1', discountType: 'fixed', value: 10, expiryDate: new Date() };
               const err = new Error('dup'); err.code = 11000;
               jest.spyOn(AdminService, 'createCoupon').mockRejectedValue(err);
               const res = await AdminController.createCoupon(mockReq);
               expect(res.status).toBe(400);
         });
         
         it('createCoupon handles error', async () => {
               mockReq.jsonBody = { code: '1', discountType: 'fixed', value: 10, expiryDate: new Date() };
               jest.spyOn(AdminService, 'createCoupon').mockRejectedValue(new Error('err'));
               const res = await AdminController.createCoupon(mockReq);
               expect(res.status).toBe(500);
         });

         it('getCoupons succeeds', async () => {
              jest.spyOn(AdminService, 'getCoupons').mockResolvedValue([]);
              const res = await AdminController.getCoupons(mockReq);
              expect(res.status).toBe(200);
         });

         it('getCoupons fails', async () => {
              jest.spyOn(AdminService, 'getCoupons').mockRejectedValue(new Error('e'));
              const res = await AdminController.getCoupons(mockReq);
              expect(res.status).toBe(500);
         });

         it('updateCoupon succeeds', async () => {
              jest.spyOn(AdminService, 'updateCoupon').mockResolvedValue({});
              const res = await AdminController.updateCoupon(mockReq, { params: { id: '1' } });
              expect(res.status).toBe(200);
         });

         it('updateCoupon fails', async () => {
              jest.spyOn(AdminService, 'updateCoupon').mockRejectedValue(new Error('e'));
              const res = await AdminController.updateCoupon(mockReq, { params: { id: '1' } });
              expect(res.status).toBe(500);
         });

         it('deleteCoupon succeeds', async () => {
              jest.spyOn(AdminService, 'deleteCoupon').mockResolvedValue(true);
              const res = await AdminController.deleteCoupon(mockReq, { params: { id: '1' } });
              expect(res.status).toBe(200);
         });

         it('deleteCoupon fails', async () => {
              jest.spyOn(AdminService, 'deleteCoupon').mockRejectedValue(new Error('e'));
              const res = await AdminController.deleteCoupon(mockReq, { params: { id: '1' } });
              expect(res.status).toBe(500);
         });
    });

    // 9. Inquiries
    describe('Inquiries', () => {
         it('submitInquiry requires fields', async () => {
             const res = await AdminController.submitInquiry({ jsonBody: {} });
             expect(res.status).toBe(400);
         });

         it('submitInquiry succeeds', async () => {
              mockReq.jsonBody = { name: 'A', email: 'E', message: 'M' };
              jest.spyOn(AdminService, 'submitInquiry').mockResolvedValue({});
              const res = await AdminController.submitInquiry(mockReq);
              expect(res.status).toBe(201);
         });
         
         it('submitInquiry error handling', async () => {
              mockReq.jsonBody = { name: 'A', email: 'E', message: 'M' };
              jest.spyOn(AdminService, 'submitInquiry').mockRejectedValue(new Error('T'));
              const res = await AdminController.submitInquiry(mockReq);
              expect(res.status).toBe(500);
         });

         it('getInquiries succeeds', async () => {
              jest.spyOn(AdminService, 'getInquiries').mockResolvedValue([]);
              const res = await AdminController.getInquiries(mockReq);
              expect(res.status).toBe(200);
         });
         
         it('getInquiries error handling', async () => {
              jest.spyOn(AdminService, 'getInquiries').mockRejectedValue(new Error('T'));
              const res = await AdminController.getInquiries(mockReq);
              expect(res.status).toBe(500);
         });

         it('updateInquiry succeeds', async () => {
              jest.spyOn(AdminService, 'updateInquiry').mockResolvedValue({});
              const res = await AdminController.updateInquiry(mockReq, { params: { id: '1' } });
              expect(res.status).toBe(200);
         });
         
         it('updateInquiry error handling', async () => {
              jest.spyOn(AdminService, 'updateInquiry').mockRejectedValue(new Error('T'));
              const res = await AdminController.updateInquiry(mockReq, { params: { id: '1' } });
              expect(res.status).toBe(500);
         });

         it('deleteInquiry succeeds', async () => {
              jest.spyOn(AdminService, 'deleteInquiry').mockResolvedValue(true);
              const res = await AdminController.deleteInquiry(mockReq, { params: { id: '1' } });
              expect(res.status).toBe(200);
         });
         
         it('deleteInquiry error handling', async () => {
              jest.spyOn(AdminService, 'deleteInquiry').mockRejectedValue(new Error('T'));
              const res = await AdminController.deleteInquiry(mockReq, { params: { id: '1' } });
              expect(res.status).toBe(500);
         });
    });

    // 10. Analytics
    describe('Analytics', () => {
         it('getAnalytics defaults', async () => {
              jest.spyOn(AdminService, 'getAnalyticsData').mockResolvedValue({});
              const res = await AdminController.getAnalytics(mockReq);
              expect(res.status).toBe(200);
         });

         it('getAnalytics map', async () => {
              mockReq.url = 'http://localhost/admin?type=map';
              jest.spyOn(AdminService, 'getMapAnalyticsData').mockResolvedValue({});
              const res = await AdminController.getAnalytics(mockReq);
              expect(res.status).toBe(200);
         });

         it('getAnalytics calendar', async () => {
              mockReq.url = 'http://localhost/admin?type=calendar&start=a&end=b';
              jest.spyOn(AdminService, 'getCalendarEvents').mockResolvedValue({});
              const res = await AdminController.getAnalytics(mockReq);
              expect(res.status).toBe(200);
         });

         it('getAnalytics search', async () => {
              mockReq.url = 'http://localhost/admin?type=search';
              jest.spyOn(AdminService, 'getSearchAnalytics').mockResolvedValue({});
              const res = await AdminController.getAnalytics(mockReq);
              expect(res.status).toBe(200);
         });
         
         it('getAnalytics financial', async () => {
              mockReq.url = 'http://localhost/admin?type=financial';
              jest.spyOn(AdminService, 'getFinancialStats').mockResolvedValue({});
              const res = await AdminController.getAnalytics(mockReq);
              expect(res.status).toBe(200);
         });

         it('getAnalytics health', async () => {
              mockReq.url = 'http://localhost/admin?type=health';
              jest.spyOn(AdminService, 'getSystemHealth').mockResolvedValue({});
              const res = await AdminController.getAnalytics(mockReq);
              expect(res.status).toBe(200);
         });

         it('getAnalytics catches error', async () => {
              jest.spyOn(AdminService, 'getAnalyticsData').mockRejectedValue(new Error('B'));
              const res = await AdminController.getAnalytics(mockReq);
              expect(res.status).toBe(500);
         });
    });

    // 11. Audit Logs
    describe('Audit Logs', () => {
         it('getAuditLogs succeeds', async () => {
              jest.spyOn(AdminService, 'getAuditLogs').mockResolvedValue([]);
              const res = await AdminController.getAuditLogs(mockReq);
              expect(res.status).toBe(200);
         });

         it('getAuditLogs catches error', async () => {
              jest.spyOn(AdminService, 'getAuditLogs').mockRejectedValue(new Error('fail'));
              const res = await AdminController.getAuditLogs(mockReq);
              expect(res.status).toBe(500);
         });
    });
});
