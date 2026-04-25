import mongoose from 'mongoose';
import { jest } from '@jest/globals';

// 1. Mock External dependencies
const mockNotification = { 
    notifyVendorApproval: jest.fn(), 
    notifyDocumentVerification: jest.fn() 
};
const mockBusiness = { calculateTrustBadge: jest.fn() };
const mockAudit = { logAction: jest.fn() };
const mockOCR = { processDocument: jest.fn() };

jest.unstable_mockModule('@/core/Services/General/NotificationService.js', () => ({ default: mockNotification }));
jest.unstable_mockModule('@/core/Services/Vendor/BusinessService.js', () => ({ default: mockBusiness }));
jest.unstable_mockModule('@/core/Services/Admin/AuditService.js', () => ({ default: mockAudit }));
jest.unstable_mockModule('@/core/Services/Admin/OCRService.js', () => ({ default: mockOCR }));

// 2. Import core models and services AFTER mocking
const { default: VendorService } = await import('@/core/Services/Admin/VendorService.js');
const { default: User } = await import('@/core/Models/User.js');
const { default: Vendor } = await import('@/core/Models/Vendor.js');
const { default: VerifiedIdentity } = await import('@/core/Models/VerifiedIdentity.js');

describe('Deep Integration: Vendor Verification Life-Cycle', () => {
    let testUser;
    let testVendor;

    beforeAll(() => {
        // Mock global fetch for image processing
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                status: 200,
                arrayBuffer: () => Promise.resolve(new Uint8Array(100).buffer)
            })
        );
    });

    beforeEach(async () => {
        jest.clearAllMocks();
        
        // Setup initial Vendor state
        testUser = await User.create({
            name: "Mradul Vendor",
            email: "mradul@vendor.com",
            phone: "1234567890",
            role: 'vendor',
            status: 'pending'
        });

        testVendor = await Vendor.create({
            user: testUser._id,
            businessName: "Pahadi Adventures",
            ownerName: "Mradul Sharma",
            isApproved: false,
            documents: {
                aadharCard: [{
                    url: "https://cloudinary.com/aadharCard.jpg",
                    status: 'pending'
                }]
            }
        });

        // Link back to user for population tests
        testUser.vendorProfile = testVendor._id;
        await testUser.save();
    });

    it('should execute full OCR verification flow and activate vendor', async () => {
        // Define OCR result
        mockOCR.processDocument.mockResolvedValue({
            idType: 'AADHAAR',
            identifiedId: '1234 5678 9012',
            name: 'MRADUL SHARMA',
            dob: '01/01/1990',
            text: 'AADHAAR CARD MRADUL SHARMA 1234 5678 9012',
            error: false
        });

        const ocrPayload = {
            vendorId: testVendor._id,
            documentField: 'aadharCard',
            index: 0
        };

        const result = await VendorService.verifyDocumentOCR(ocrPayload, { user: { id: 'admin_123' } });

        // A. Verify Identity Record Persistence
        expect(result.idNumber).toBe('1234 5678 9012');
        const identity = await VerifiedIdentity.findOne({ vendor: testVendor._id });
        expect(identity).toBeDefined();
        expect(identity.docType).toBe('AADHAAR');

        // B. Verify Vendor Profile State Mutation
        const updatedVendor = await Vendor.findById(testVendor._id);
        expect(updatedVendor.isApproved).toBe(true);
        expect(updatedVendor.status).toBe('active');
        expect(updatedVendor.documents.aadharCard[0].status).toBe('verified');

        // C. Verify User Account Sync
        const updatedUser = await User.findById(testUser._id);
        expect(updatedUser.status).toBe('active');

        // D. Verify Side-Effects (Trust Badge & Audit)
        expect(mockBusiness.calculateTrustBadge).toHaveBeenCalledWith(testVendor._id);
        expect(mockAudit.logAction).toHaveBeenCalled();
    });

    it('should handle manual approval flow correctly', async () => {
        const result = await VendorService.updateVendorStatus(testVendor._id, 'active');

        expect(result.vendorProfile.isApproved).toBe(true);
        expect(mockNotification.notifyVendorApproval).toHaveBeenCalledWith(testVendor._id, true);
        expect(mockBusiness.calculateTrustBadge).toHaveBeenCalledWith(testVendor._id);
    });

    it('should throw error if document image fetch fails', async () => {
        global.fetch.mockResolvedValueOnce({ ok: false, status: 404 });

        await expect(VendorService.verifyDocumentOCR({ 
            vendorId: testVendor._id, 
            documentField: 'aadharCard',
            index: 0
        })).rejects.toThrow('Failed to fetch document image');
    });
});
