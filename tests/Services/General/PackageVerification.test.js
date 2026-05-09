import mongoose from 'mongoose';
import Package from '@/core/Models/Package.js';
import Vendor from '@/core/Models/Vendor.js';
import User from '@/core/Models/User.js';
import Category from '@/core/Models/Category.js';
import VendorDocument from '@/core/Models/VendorDocument.js';
import PackageService from '@/core/Services/General/PackageService.js';
import { VERIFICATION_STATUS } from '@/core/Constants/index.js';

describe('Integration Test: Package Visibility & Category Verification', () => {
    let vendorUser;
    let vendorProfile;
    let packageId;

    beforeEach(async () => {
        // 0. Setup Category
        await Category.create({
            name: 'Homestay',
            slug: 'homestay',
            isActive: true
        });

        // 1. Setup User & Vendor
        vendorUser = await User.create({
            email: 'test-vendor@example.com',
            role: 'vendor',
            identifier: 'test-vendor'
        });

        vendorProfile = await Vendor.create({
            user: vendorUser._id,
            status: 'active',
            isOperating: true,
            isApproved: true,
            profileType: 'individual',
            documents: {
                panCard: { status: 'verified' },
                aadharCard: [{ status: 'verified' }]
            }
        });

        // 2. Setup Package with one Homestay item
        const pkg = await Package.create({
            user: vendorUser._id,
            vendor: vendorProfile._id,
            homestay: [{
                title: 'Test Homestay',
                slug: 'test-homestay',
                description: 'A beautiful place',
                isActive: true,
                location: { address: 'Test Address' },
                pricing: { pricePerNight: 1000 }
            }]
        });
        packageId = pkg._id;
    });

    it('should NOT show the homestay in public list if category is not verified', async () => {
        // Initially, no VendorDocument exists for homestay
        const results = await PackageService.getAvailablePackagesByCategory();
        
        // Should find the category but items should be empty
        expect(results.homestay).toBeDefined();
        const foundItem = results.homestay.find(item => item.title === 'Test Homestay');
        expect(foundItem).toBeUndefined();
    });

    it('should SHOW the homestay in public list after category is verified', async () => {
        // 1. Verify the homestay category
        await VendorDocument.create({
            user: vendorUser._id,
            vendor: vendorProfile._id,
            category_slug: 'homestay',
            document_slug: 'test-doc',
            url: 'http://example.com/doc.jpg',
            status: VERIFICATION_STATUS.VERIFIED
        });

        // 2. Fetch packages
        const results = await PackageService.getAvailablePackagesByCategory();
        
        // Should now find the item
        const foundItem = results.homestay.find(item => item.title === 'Test Homestay');
        expect(foundItem).toBeDefined();
        expect(foundItem.title).toBe('Test Homestay');
    });

    it('should HIDE the homestay if the verification status is changed to pending', async () => {
        // 1. Create a pending verification
        const doc = await VendorDocument.create({
            user: vendorUser._id,
            vendor: vendorProfile._id,
            category_slug: 'homestay',
            document_slug: 'test-doc',
            url: 'http://example.com/doc.jpg',
            status: VERIFICATION_STATUS.PENDING
        });

        // 2. Fetch packages - should be empty
        let results = await PackageService.getAvailablePackagesByCategory();
        expect(results.homestay.find(i => i.title === 'Test Homestay')).toBeUndefined();

        // 3. Update to verified
        doc.status = VERIFICATION_STATUS.VERIFIED;
        await doc.save();

        // 4. Fetch packages - should show item
        results = await PackageService.getAvailablePackagesByCategory();
        expect(results.homestay.find(i => i.title === 'Test Homestay')).toBeDefined();
    });
});
