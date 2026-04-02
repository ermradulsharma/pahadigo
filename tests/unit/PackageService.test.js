import PackageService from '../../src/core/Services/PackageService.js';
import Package from '../../src/core/Models/Package.js';
import Vendor from '../../src/core/Models/Vendor.js';
import mongoose from 'mongoose';

import { cleanDatabase } from '../helpers/testUtils.js';

describe('PackageService Test Suite', () => {
    let vendorId;

    beforeEach(async () => {
        await cleanDatabase();
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
        const item = await PackageService.addServiceItem(vendorId, 'trekking', {
            title: 'Himalayan Trek',
            description: 'Sample description',
            pricing: { pricePerPerson: 500 },
            location: { address: 'Test Address' }
        });

        expect(item.id).toBeDefined();
        expect(item.title).toBe('Himalayan Trek');
        expect(Number(item.pricing.pricePerPerson)).toBe(500);
    });

    it('should update an existing service item using pricing schema', async () => {
        const initialItem = await PackageService.addServiceItem(vendorId, 'trekking', { 
            title: 'EBC', description: 'desc', pricing: { pricePerPerson: 100 }, location: { address: 'test' } 
        });
        const itemId = initialItem.id;

        const updatedItem = await PackageService.updateServiceItem(vendorId, 'trekking', itemId, { 'pricing.pricePerPerson': 200 });
        expect(Number(updatedItem.pricing.pricePerPerson)).toBe(200);
    });

    it('should format vendor catalog into flattened items array', async () => {
        await PackageService.addServiceItem(vendorId, 'trekking', { 
            title: 'Base Camp', description: 'desc', pricing: { pricePerPerson: 100 }, location: { address: 'test' } 
        });
        const formatted = await PackageService.getFormattedVendorCatalog(vendorId);
        
        expect(Array.isArray(formatted.items)).toBe(true);
        expect(formatted.items[0].category_slug).toBe('trekking');
        expect(formatted.items[0].title).toBe('Base Camp');
        // Ensure items contain flattened vendor context when fetched globally
        const packages = await PackageService.getAvailablePackages('Base');
        expect(packages[0]._id).toBeDefined();
    });

    it('should throw error for unauthorized categories', async () => {
        await expect(PackageService.addServiceItem(vendorId, 'homestay', { title: 'X' })).rejects.toThrow();
    });
});
