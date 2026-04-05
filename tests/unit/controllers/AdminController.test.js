import AdminController from '../../../src/core/Http/Controllers/AdminController.js';
import AdminService from '../../../src/core/Services/AdminService.js';
import VendorService from '../../../src/core/Services/VendorService.js';
import NotificationService from '../../../src/core/Services/NotificationService.js';
import BookingService from '../../../src/core/Services/BookingService.js';
import OCRService from '../../../src/core/Services/OCRService.js';
import Vendor from '../../../src/core/Models/Vendor.js';
import { createMockReq, cleanDatabase, generateId } from '../../helpers/testUtils.js';
import { HTTP_STATUS, USER_ROLES } from '../../../src/core/Constants/index.js';
import { jest } from '@jest/globals';
import mongoose from 'mongoose';

describe('Industry Standard: Admin Operations API', () => {
    let adminId;

    beforeEach(async () => {
        await cleanDatabase();
        adminId = generateId();
        jest.clearAllMocks();
        
        // Mock administrative side effects
        jest.spyOn(VendorService, 'evaluateVendorTrustBadge').mockResolvedValue({});
        jest.spyOn(NotificationService, 'notifyDocumentVerification').mockResolvedValue({});
    });

    describe('Feature: Oversight & Dashboard', () => {
        it('[Success] should render holistic dashboard statistics', async () => {
            const req = createMockReq({ user: { id: adminId.toString(), role: USER_ROLES.ADMIN } });
            jest.spyOn(AdminService, 'getDashboardStats').mockResolvedValue({ totalRevenue: 50000 });
            
            const res = await AdminController.getStats(req);
            expect(res.status).toBe(HTTP_STATUS.OK);
            
            const body = await res.json();
            expect(body.data.stats.totalRevenue).toEqual(50000);
        });
    });

    describe('Feature: Vendor Governance', () => {
        it('[Integrity] should update vendor status with trust evaluation', async () => {
            const vendorId = generateId();
            const req = createMockReq({ 
                user: { role: USER_ROLES.ADMIN },
                jsonBody: { vendorId: vendorId.toString(), status: 'verified' } 
            });
            
            jest.spyOn(Vendor, 'findByIdAndUpdate').mockResolvedValue({ _id: vendorId });
            const res = await AdminController.approveVendor(req);
            
            expect(res.status).toBe(HTTP_STATUS.OK);
            expect(VendorService.evaluateVendorTrustBadge).toHaveBeenCalledWith(vendorId.toString());
        });
    });

    describe('Feature: Financial Controls', () => {
        it('[Success] should mark manual payout as settled', async () => {
            const bookingId = generateId();
            const req = createMockReq({ 
                user: { role: USER_ROLES.ADMIN },
                jsonBody: { bookingId: bookingId.toString() } 
            });
            
            jest.spyOn(BookingService, 'markPayout').mockResolvedValue(true);
            const res = await AdminController.markPayout(req);
            
            expect(res.status).toBe(HTTP_STATUS.OK);
            expect(BookingService.markPayout).toHaveBeenCalledWith(bookingId.toString(), expect.any(Object));
        });
    });

    describe('Feature: Platform Management', () => {
        it('[Success] should resolve disputes with admin notes', async () => {
            const disputeId = generateId();
            const req = createMockReq({ 
                user: { id: adminId.toString(), role: USER_ROLES.ADMIN },
                params: { id: disputeId.toString() },
                jsonBody: { decision: 'resolved_refunded', adminNotes: 'Confirmed bug' } 
            });
            
            jest.spyOn(AdminService, 'resolveDispute').mockResolvedValue({});
            const res = await AdminController.resolveDispute(req, { params: req.params });
            
            expect(res.status).toBe(HTTP_STATUS.OK);
            expect(AdminService.resolveDispute).toHaveBeenCalledWith(
                adminId.toString(),
                disputeId.toString(),
                'resolved_refunded',
                'Confirmed bug',
                expect.any(Object)
            );
        });
    });
});
