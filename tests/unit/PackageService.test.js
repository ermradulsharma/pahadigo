import PackageService from '../../src/services/PackageService.js';
import Package from '../../src/models/Package.js';
import Vendor from '../../src/models/Vendor.js';
import mongoose from 'mongoose';

describe('PackageService', () => {
    let vendorId;

    beforeEach(async () => {
        const vendor = await Vendor.create({
            user: new mongoose.Types.ObjectId(),
            businessName: 'Test Travels',
            category: ['Trekking'],
            isApproved: true,
            documents: {
                aadharCard: [{ url: 'http://test.com/aadhar.jpg' }],
                panCard: { url: 'http://test.com/pan.jpg' },
                businessRegistration: { url: 'http://test.com/biz.jpg' },
                gstRegistration: { url: 'http://test.com/gst.jpg' }
            }
        });
        vendorId = vendor._id;
    });

    it('should ensure a catalog exists for a vendor', async () => {
        const catalog = await PackageService.ensureCatalog(vendorId);
        expect(catalog).toBeDefined();
        expect(catalog.vendor.toString()).toBe(vendorId.toString());
        expect(catalog.services.trekking).toBeDefined();
    });

    it('should add a service item', async () => {
        const itemData = {
            trekkingName: 'Himalayan Trek',
            duration: '3 Days',
            pricePerPerson: 10000,
            location: 'Uttarakhand'
        };

        const updatedCatalog = await PackageService.addServiceItem(vendorId, 'trekking', itemData);
        expect(updatedCatalog.services.trekking.length).toBe(1);
        expect(updatedCatalog.services.trekking[0].trekkingName).toBe(itemData.trekkingName);
    });

    it('should update a service item', async () => {
        const itemData = {
            trekkingName: 'Old Trek',
            duration: '1 Day',
            pricePerPerson: 1000,
            location: 'Local'
        };
        const catalog = await PackageService.addServiceItem(vendorId, 'trekking', itemData);
        const itemId = catalog.services.trekking[0]._id;

        const updatedCatalog = await PackageService.updateServiceItem(vendorId, 'trekking', itemId, { trekkingName: 'New Trek' });
        expect(updatedCatalog.services.trekking[0].trekkingName).toBe('New Trek');
    });

    it('should toggle item status', async () => {
        const itemData = {
            trekkingName: 'Toggle Trek',
            duration: '1 Day',
            pricePerPerson: 1000,
            location: 'Local'
        };
        const catalog = await PackageService.addServiceItem(vendorId, 'trekking', itemData);
        const itemId = catalog.services.trekking[0]._id;

        const updatedCatalog = await PackageService.toggleItemStatus(vendorId, 'trekking', itemId, false);
        expect(updatedCatalog.services.trekking[0].isActive).toBe(false);
    });
});
