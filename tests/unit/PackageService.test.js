import PackageService from '../../src/core/Services/PackageService.js';
import Package from '../../src/core/Models/Package.js';
import Vendor from '../../src/core/Models/Vendor.js';
import mongoose from 'mongoose';

describe('PackageService Test Suite', () => {
    let vendorId;

    beforeEach(async () => {
        const vendor = await Vendor.create({
            user: new mongoose.Types.ObjectId(),
            businessName: 'Package Vendor',
            category: [{ _id: new mongoose.Types.ObjectId(), name: 'Trekking', slug: 'trekking' }]
        });
        vendorId = vendor._id;
    });

    it('should initialize an empty catalog for a new vendor', async () => {
        const catalog = await PackageService.getVendorCatalog(vendorId);
        expect(catalog.vendor.toString()).toBe(vendorId.toString());
        expect(catalog.trekking.length).toBe(0);
    });

    it('should add an item with correct pricing schema', async () => {
        const catalog = await PackageService.addServiceItem(vendorId, 'trekking', {
            title: 'Himalayan Trek',
            description: 'Sample description',
            pricing: { pricePerPerson: 500 },
            location: { address: 'Test Address' }
        });

        expect(catalog.trekking.length).toBe(1);
        expect(Number(catalog.trekking[0].pricing.pricePerPerson)).toBe(500);
    });

    it('should update an existing service item using pricing schema', async () => {
        const initial = await PackageService.addServiceItem(vendorId, 'trekking', { 
            title: 'EBC', description: 'desc', pricing: { pricePerPerson: 100 }, location: { address: 'test' } 
        });
        const itemId = initial.trekking[0]._id;

        const updated = await PackageService.updateServiceItem(vendorId, 'trekking', itemId, { 'pricing.pricePerPerson': 200 });
        expect(Number(updated.trekking[0].pricing.pricePerPerson)).toBe(200);
    });

    it('should format vendor catalog into services array', async () => {
        await PackageService.addServiceItem(vendorId, 'trekking', { 
            title: 'Base Camp', description: 'desc', pricing: { pricePerPerson: 100 }, location: { address: 'test' } 
        });
        const formatted = await PackageService.getFormattedVendorCatalog(vendorId);
        
        expect(Array.isArray(formatted.services)).toBe(true);
        expect(formatted.services[0].slug).toBe('trekking');
        expect(formatted.services[0].items.length).toBe(1);
        expect(formatted.services[0].items[0].title).toBe('Base Camp');
        // Ensure items contain flattened vendor context when fetched globally
        const packages = await PackageService.getAvailablePackages('Base');
        expect(packages[0].vendor).toBeDefined();
        expect(packages[0].vendor.name).toBeDefined();
    });

    it('should throw error for unauthorized categories', async () => {
        await expect(PackageService.addServiceItem(vendorId, 'homestay', { title: 'X' })).rejects.toThrow();
    });
});
