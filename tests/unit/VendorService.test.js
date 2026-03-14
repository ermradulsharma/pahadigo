import VendorService from '../../src/core/Services/VendorService.js';
import Vendor from '../../src/core/Models/Vendor.js';
import User from '../../src/core/Models/User.js';
import mongoose from 'mongoose';

describe('VendorService Test Suite', () => {
    let userId;

    beforeEach(async () => {
        const user = await User.create({ email: 'vendor@test.com', role: 'vendor' });
        userId = user._id;
    });

    it('should upsert a new vendor profile', async () => {
        const profileData = {
            businessName: 'Himalayan Tours',
            businessAbout: 'We guide you to the peaks.'
        };

        const vendor = await VendorService.upsertProfile(userId, profileData);
        expect(vendor).toBeDefined();
        // Check both cases: populated or just ID
        const vendorUserId = vendor.user._id || vendor.user;
        expect(vendorUserId.toString()).toBe(userId.toString());
        expect(vendor.businessName).toBe('Himalayan Tours');
    });

    it('should update an existing vendor profile without overwriting unspecified nested documents', async () => {
        await VendorService.upsertProfile(userId, { businessName: 'Old Name' });

        const updated = await VendorService.upsertProfile(userId, {
            businessName: 'New Name',
            documents: {
                panCard: { url: 'http://pan.com' }
            }
        });

        expect(updated.businessName).toBe('New Name');
        expect(updated.documents.panCard.url).toBe('http://pan.com');
    });

    it('should add and remove categories', async () => {
        await VendorService.upsertProfile(userId, { businessName: 'Cat Test' });

        const categoryData = { _id: new mongoose.Types.ObjectId(), name: 'Trekking', slug: 'trekking' };

        await VendorService.addCategory(userId, categoryData);
        let vendor = await VendorService.findByUserId(userId);
        expect(vendor.category.length).toBe(1);
        expect(vendor.category[0].slug).toBe('trekking');

        await VendorService.removeCategory(userId, 'trekking');
        vendor = await VendorService.findByUserId(userId);
        expect(vendor.category.length).toBe(0);
    });
});
