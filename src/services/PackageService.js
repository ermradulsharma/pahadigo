import Package from '../models/Package.js';
import Vendor from '../models/Vendor.js';

class PackageService {

    // Helper: Find or Create Catalog for Vendor
    async ensureCatalog(vendorId) {
        let pkg = await Package.findOne({ vendor: vendorId });
        if (!pkg) {
            pkg = await Package.create({
                vendor: vendorId,
                services: {
                    homestay: [],
                    camping: [],
                    trekking: [],
                    rafting: [],
                    bungeeJumping: [],
                    vehicleRental: [],
                    chardhamTour: []
                }
            });
        }
        return pkg;
    }

    async getVendorCatalog(vendorId) {
        return await this.ensureCatalog(vendorId);
    }

    // Add Item to Specific Service Array
    async addServiceItem(vendorId, category, itemData) {
        const pkg = await this.ensureCatalog(vendorId);

        if (!pkg.services[category]) {
            throw new Error(`Invalid category: ${category}`);
        }

        pkg.services[category].push(itemData);
        return await pkg.save();
    }

    // Update Item in Service Array
    async updateServiceItem(vendorId, category, itemId, updates) {
        const pkg = await this.ensureCatalog(vendorId);

        if (!pkg.services[category]) {
            throw new Error(`Invalid category: ${category}`);
        }

        const item = pkg.services[category].id(itemId);
        if (!item) throw new Error('Item not found');

        Object.assign(item, updates);
        return await pkg.save();
    }

    // Remove Item from Service Array
    async removeServiceItem(vendorId, category, itemId) {
        const pkg = await this.ensureCatalog(vendorId);

        if (!pkg.services[category]) {
            throw new Error(`Invalid category: ${category}`);
        }

        pkg.services[category].pull({ _id: itemId });
        return await pkg.save();
    }

    // Toggle Item Status
    async toggleItemStatus(vendorId, category, itemId, isActive) {
        // Re-use update logic
        return await this.updateServiceItem(vendorId, category, itemId, { isActive });
    }

    // Toggle Category Status (Bulk)
    async toggleCategoryStatus(vendorId, category, isActive) {
        const pkg = await this.ensureCatalog(vendorId);
        if (!pkg.services[category]) throw new Error(`Invalid category: ${category}`);

        pkg.services[category].forEach(item => {
            item.isActive = isActive;
        });

        return await pkg.save();
    }
}

const packageService = new PackageService();
export default packageService;
