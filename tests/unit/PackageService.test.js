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
        await expect(PackageService.updateServiceItem(vendorId, 'invalidCategory', new mongoose.Types.ObjectId(), {})).rejects.toThrow();
        await expect(PackageService.removeServiceItem(vendorId, 'invalidCategory', new mongoose.Types.ObjectId())).rejects.toThrow();
    });

    it('should format vendor catalog effectively with categorized array lists', async () => {
        await PackageService.addServiceItem(vendorId, 'trekking', { 
            title: 'Base Camp', description: 'desc', price: 100, location: { address: 'test' } 
        });
        const formatted = await PackageService.getFormattedVendorCatalog(vendorId);
        
        expect(Array.isArray(formatted.services)).toBe(true);
        expect(formatted.services[0].slug).toBe('trekking');
        expect(formatted.services[0].items.length).toBe(1);
        expect(formatted.services[0].items[0].title).toBe('Base Camp');
        // Ensuring root keys were dropped
        expect(formatted.trekking).toBeUndefined();
    });

    it('should fetch package by catalog ID directly', async () => {
        const catalog = await PackageService.getVendorCatalog(vendorId);
        const fetched = await PackageService.getPackageById(catalog._id);
        expect(fetched._id.toString()).toBe(catalog._id.toString());
    });

    it('should retrieve granular items', async () => {
        await PackageService.addServiceItem(vendorId, 'trekking', { 
            title: 'Granular Trek', description: 'desc', price: 100, location: { address: 'test' } 
        });
        const catalog = await PackageService.getVendorCatalog(vendorId);
        const addedItemId = catalog.trekking[0]._id;

        const item = await PackageService.getGranularItem(catalog._id, 'trekking', addedItemId);
        expect(item.title).toBe('Granular Trek');

        const none = await PackageService.getGranularItem(catalog._id, 'homestay', addedItemId);
        expect(none).toBeNull();
    });

    it('should fetch available mapped global packages via query', async () => {
        await PackageService.addServiceItem(vendorId, 'trekking', { 
            title: 'Global Himalayan Trekking', description: 'desc', price: 100, location: { address: 'test' } 
        });
        
        const packages = await PackageService.getAvailablePackages('Himalayan');
        expect(packages.length).toBe(1);
        expect(packages[0].title).toBe('Global Himalayan Trekking');
        expect(packages[0].vendor).toBeDefined();

        const empty = await PackageService.getAvailablePackages('nonexistent_zzxxcc');
        expect(empty.length).toBe(0);
    });

    it('should bulk toggle category status effectively', async () => {
        await PackageService.addServiceItem(vendorId, 'trekking', { 
            title: 'Trek 1', description: 'd', price: 10, location: { address: 't' }, isActive: true 
        });
        await PackageService.addServiceItem(vendorId, 'trekking', { 
            title: 'Trek 2', description: 'd', price: 20, location: { address: 't' }, isActive: true 
        });

        const updated = await PackageService.toggleCategoryStatus(vendorId, 'trekking', false);
        expect(updated.trekking[0].isActive).toBe(false);
        expect(updated.trekking[1].isActive).toBe(false);
    });

    it('should throw toggleCategoryStatus error if invalid category key', async () => {
        await expect(PackageService.toggleCategoryStatus(vendorId, 'invalid', false)).rejects.toThrow();
    });

    it('should handle getFormattedVendorCatalog for missing vendor details safely', async () => {
        const fakeVendorId = new mongoose.Types.ObjectId();
        const formatted = await PackageService.getFormattedVendorCatalog(fakeVendorId);
        expect(formatted.services).toBeDefined();
        expect(formatted.services.length).toBe(0);
    });

    it('should throw NOT_FOUND for invalid updated item id', async () => {
        await expect(PackageService.updateServiceItem(vendorId, 'trekking', new mongoose.Types.ObjectId(), { title: '123' })).rejects.toThrow();
    });

    it('should ensure backwards compatible createPackage wrapper', async () => {
        const pkg = await PackageService.createPackage(vendorId, {});
        expect(pkg).toBeDefined();
    });
});
