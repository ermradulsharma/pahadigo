const PackageService = require('../../src/services/PackageService');
const Package = require('../../src/models/Package');
const Vendor = require('../../src/models/Vendor');
const mongoose = require('mongoose');

describe('PackageService', () => {
    let vendorId;

    beforeEach(async () => {
        const vendor = await Vendor.create({
            user: new mongoose.Types.ObjectId(),
            businessName: 'Test Travels',
            category: 'Trekking',
            isApproved: true
        });
        vendorId = vendor._id;
    });

    it('should create a new package', async () => {
        const pkgData = {
            title: 'Himalayan Trek',
            price: 15000,
            description: 'Exciting trek to the mountains',
            duration: '3 Days'
        };

        const pkg = await PackageService.createPackage(vendorId, pkgData);
        expect(pkg).toBeDefined();
        expect(pkg.title).toBe(pkgData.title);
        expect(pkg.vendor.toString()).toBe(vendorId.toString());
    });

    it('should fetch only available packages from approved vendors', async () => {
        // Approved vendor's package (already created one in beforeEach)
        await Package.create({
            vendor: vendorId,
            title: 'Approved Package',
            price: 1000,
            description: 'Test description',
            duration: '2 Days'
        });

        // Unapproved vendor's package
        const unapprovedVendor = await Vendor.create({
            user: new mongoose.Types.ObjectId(),
            businessName: 'Dodgy Travels',
            category: 'Homestay',
            isApproved: false
        });

        await Package.create({
            vendor: unapprovedVendor._id,
            title: 'Stealth Package',
            price: 500,
            description: 'Hidden package',
            duration: '1 Day'
        });

        const packages = await PackageService.getAvailablePackages();
        expect(packages.length).toBe(1);
        expect(packages[0].title).toBe('Approved Package');
    });
});
