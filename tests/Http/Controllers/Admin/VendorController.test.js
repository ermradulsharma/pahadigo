import VendorController from '@/core/Http/Controllers/Admin/VendorController.js';
import VendorDocument from '@/core/Models/VendorDocument.js';
import Vendor from '@/core/Models/Vendor.js';
import User from '@/core/Models/User.js';
import NotificationService from '@/core/Services/General/NotificationService.js';
import AuditService from '@/core/Services/Admin/AuditService.js';
import BusinessService from '@/core/Services/Vendor/BusinessService.js';
import mongoose from 'mongoose';
import { jest } from '@jest/globals';
import { HTTP_STATUS } from '@/core/Constants';

describe('VendorController: Integration Tests', () => {
    let mockUserId;
    let mockVendorId;
    let mockDocId;

    beforeEach(async () => {
        jest.clearAllMocks();
        
        // Comprehensive Spies
        jest.spyOn(NotificationService, 'notifyDocumentVerification').mockImplementation(() => {});
        jest.spyOn(NotificationService, 'notifyVendorApproval').mockImplementation(() => {});
        jest.spyOn(AuditService, 'logAction').mockImplementation(() => {});
        if (BusinessService && BusinessService.calculateTrustBadge) {
            jest.spyOn(BusinessService, 'calculateTrustBadge').mockResolvedValue('none');
        }

        mockUserId = new mongoose.Types.ObjectId();
        
        await User.create({
            _id: mockUserId,
            name: "Test Vendor",
            email: `vendor-final-v5-${Date.now()}@test.com`,
            role: "vendor",
            password: "password123"
        });

        const vendor = await Vendor.create({
            user: mockUserId,
            businessName: "Test Business Ctrl v5",
            category: [{ 
                _id: new mongoose.Types.ObjectId(),
                name: "Trekking", 
                slug: "trekking" 
            }]
        });
        mockVendorId = vendor._id;

        const document = await VendorDocument.create({
            user_id: mockUserId,
            vendor_id: mockVendorId,
            category_slug: "trekking",
            document_slug: "license",
            url: "http://test.com/doc.jpg",
            status: "pending"
        });
        mockDocId = document._id;
    });

    const createMockReq = (body) => ({
        jsonBody: body, // Pattern used in VendorController.js
        json: jest.fn().mockResolvedValue(body),
        user: { id: new mongoose.Types.ObjectId().toString() }
    });

    it('[Success] should return OK when category document is verified', async () => {
        const mockReq = createMockReq({
            documentId: mockDocId.toString(),
            status: 'verified'
        });

        const response = await VendorController.verifyCategoryDocument(mockReq);
        
        if (response.status !== 200) {
            const body = await response.json();
            console.error("FAILED RESPONSE BODY:", body);
        }

        expect(response.status).toBe(HTTP_STATUS.OK);
        
        const updatedDoc = await VendorDocument.findById(mockDocId);
        expect(updatedDoc.status).toBe('verified');
    });

    it('[Success] should update vendor status via approveVendor method', async () => {
        const mockReq = createMockReq({
            vendorId: mockVendorId.toString(),
            status: 'active'
        });

        const response = await VendorController.approveVendor(mockReq);

        if (response.status !== 200) {
            const body = await response.json();
            console.error("FAILED RESPONSE BODY:", body);
        }

        expect(response.status).toBe(HTTP_STATUS.OK);
        
        const updatedVendor = await Vendor.findById(mockVendorId);
        expect(updatedVendor.isApproved).toBe(true);

        const updatedUser = await User.findById(mockUserId);
        expect(updatedUser.status).toBe('active');
    });
});
