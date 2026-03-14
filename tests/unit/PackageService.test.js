import PackageService from '../../src/core/Services/PackageService.js';
import Package from '../../src/core/Models/Package.js';
import Vendor from '../../src/core/Models/Vendor.js';
import mongoose from 'mongoose';

describe('PackageService Test Suite', () => {
    let vendorId;
    let itemId;

    beforeEach(async () => {
        const vendor = await Vendor.create({
            user: new mongoose.Types.ObjectId(),
            businessName: 'Package Vendor',
            bankDetails: {
                accountHolderName: 'Vendor',
                accountNumber: '111',
                ifscCode: 'IFSC111',
                bankName: 'Test Bank',
                cancelledCheque: { url: 'http://test.com' }
            },
            documents: {
                panCard: { url: 'http://test.com' },
                businessRegistration: { url: 'http://test.com' },
                gstRegistration: { url: 'http://test.com' }
            },
            category: [{ _id: new mongoose.Types.ObjectId(), name: 'Trekking', slug: 'trekking' }]
        });
        vendorId = vendor._id;
    });

    it('should initialize an empty catalog for a new vendor', async () => {
        const catalog = await PackageService.getVendorCatalog(vendorId);
        expect(catalog.vendor.toString()).toBe(vendorId.toString());
        expect(catalog.trekking.length).toBe(0);
    });

    it('should add an item to a specific service category', async () => {
        const catalog = await PackageService.addServiceItem(vendorId, 'trekking', {
            title: 'Everest Base Camp',
            description: 'Sample description',
            price: 50000,
            duration: 14,
            trekType: 'Moderate',
            location: { address: 'Test Address' }
        });

        expect(catalog.trekking.length).toBe(1);
        expect(catalog.trekking[0].title).toBe('Everest Base Camp');
        itemId = catalog.trekking[0]._id;
    });

    it('should update an existing service item', async () => {
        await PackageService.addServiceItem(vendorId, 'trekking', { 
            title: 'EBC', 
            description: 'desc', 
            price: 100, 
            location: { address: 'test' } 
        });
        const catalog = await PackageService.getVendorCatalog(vendorId);
        const addedItemId = catalog.trekking[0]._id;

        const updated = await PackageService.updateServiceItem(vendorId, 'trekking', addedItemId, { price: 200 });
        expect(updated.trekking[0].price).toBe(200);
    });

    it('should toggle an item status', async () => {
        await PackageService.addServiceItem(vendorId, 'trekking', { 
            title: 'EBC', 
            description: 'desc', 
            price: 100, 
            location: { address: 'test' } 
        });
        const catalog = await PackageService.getVendorCatalog(vendorId);
        const addedItemId = catalog.trekking[0]._id;

        const toggled = await PackageService.toggleItemStatus(vendorId, 'trekking', addedItemId, false);
        expect(toggled.trekking[0].isActive).toBe(false);
    });

    it('should remove a service item', async () => {
        await PackageService.addServiceItem(vendorId, 'trekking', { 
            title: 'EBC', 
            description: 'desc', 
            price: 100, 
            location: { address: 'test' } 
        });
        const catalog = await PackageService.getVendorCatalog(vendorId);
        const addedItemId = catalog.trekking[0]._id;

        const removed = await PackageService.removeServiceItem(vendorId, 'trekking', addedItemId);
        expect(removed.trekking.length).toBe(0);
    });

    it('should throw an error for invalid service categories', async () => {
        await expect(PackageService.addServiceItem(vendorId, 'invalidCategory', {})).rejects.toThrow();
    });
});
