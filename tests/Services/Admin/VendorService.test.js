import VendorService from '@/core/Services/Admin/VendorService';
import Vendor from '@/core/Models/Vendor';
import User from '@/core/Models/User';
import VendorDocument from '@/core/Models/VendorDocument';
import mongoose from 'mongoose';
import { jest } from '@jest/globals';

describe('VendorService: Integration Tests', () => {
    let mockUserId;
    let mockVendorId;
    let mockDocId;

    beforeEach(async () => {
        mockUserId = new mongoose.Types.ObjectId();
        
        // Create a dummy user
        await User.create({
            _id: mockUserId,
            name: "Test Vendor",
            email: "vendor@test.com",
            role: "vendor",
            password: "password123"
        });

        // Create a dummy vendor profile with REQUIRED _id for each category
        const vendor = await Vendor.create({
            user: mockUserId,
            businessName: "Test Business",
            category: [{ 
                _id: new mongoose.Types.ObjectId(), // MANDATORY for validation
                name: "Trekking", 
                slug: "trekking" 
            }]
        });
        mockVendorId = vendor._id;

        // Create a dummy vendor document
        const document = await VendorDocument.create({
            user: mockUserId,
            vendor: mockVendorId,
            category_slug: "trekking",
            document_slug: "license",
            url: "http://test.com/doc.jpg",
            status: "pending"
        });
        mockDocId = document._id;
    });

    it('[Success] should update category document status', async () => {
        const payload = {
            documentId: mockDocId,
            status: 'verified'
        };

        const result = await VendorService.verifyCategoryDocument(payload);
        
        expect(result.status).toBe('verified');
        const updatedDoc = await VendorDocument.findById(mockDocId);
        expect(updatedDoc.status).toBe('verified');
    });

    it('[Failure] should throw error if vendor document not found', async () => {
        const randomId = new mongoose.Types.ObjectId();
        await expect(
            VendorService.verifyCategoryDocument({ documentId: randomId, status: 'verified' })
        ).rejects.toThrow();
    });
});
