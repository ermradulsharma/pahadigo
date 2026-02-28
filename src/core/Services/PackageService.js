import Package from '@/models/Package.js';
import Vendor from '@/models/Vendor.js';
import { RESPONSE_MESSAGES } from '@/constants/index.js';

class PackageService {

    // Helper: Find or Create Catalog for Vendor
    async ensureCatalog(vendorId) {
        let pkg = await Package.findOne({ vendor: vendorId });
        if (!pkg) {
            pkg = await Package.create({
                vendor: vendorId,
                homestay: [],
                camping: [],
                trekking: [],
                rafting: [],
                bungeeJumping: [],
                vehicleRental: [],
                chardhamTour: [],
                skiing: [],
                paragliding: []
            });
        }
        return pkg;
    }

    async getVendorCatalog(vendorId) {
        return await this.ensureCatalog(vendorId);
    }

    // Helper to get allowed categories for a vendor
    async _getAllowedCategories(vendorId) {
        const vendor = await Vendor.findById(vendorId);
        if (!vendor || !vendor.category) return [];

        return vendor.category.map(c => c.slug).filter(Boolean);
    }

    // Add Item to Specific Service Array
    async addServiceItem(vendorId, category, itemData) {
        const allowedCategories = await this._getAllowedCategories(vendorId);
        if (!allowedCategories.includes(category)) {
            throw new Error(`Vendor not authorized to create items in category: ${category}`);
        }
        const pkg = await this.ensureCatalog(vendorId);
        if (!pkg[category]) {
            throw new Error(RESPONSE_MESSAGES.ERROR.INVALID_CATEGORY);
        }
        pkg[category].push(itemData);
        return await pkg.save();
    }

    // Update Item in Service Array
    async updateServiceItem(vendorId, category, itemId, updates) {
        const allowedCategories = await this._getAllowedCategories(vendorId);
        if (!allowedCategories.includes(category)) {
            throw new Error(`Vendor not authorized to update items in category: ${category}`);
        }

        const pkg = await this.ensureCatalog(vendorId);

        if (!pkg[category]) {
            throw new Error(RESPONSE_MESSAGES.ERROR.INVALID_CATEGORY);
        }

        const item = pkg[category].id(itemId);
        if (!item) throw new Error(RESPONSE_MESSAGES.ITEM.NOT_FOUND);

        Object.assign(item, updates);
        return await pkg.save();
    }

    // Remove Item from Service Array
    async removeServiceItem(vendorId, category, itemId) {
        const allowedCategories = await this._getAllowedCategories(vendorId);
        if (!allowedCategories.includes(category)) {
            throw new Error(`Vendor not authorized to remove items in category: ${category}`);
        }

        const pkg = await this.ensureCatalog(vendorId);

        if (!pkg[category]) {
            throw new Error(RESPONSE_MESSAGES.ERROR.INVALID_CATEGORY);
        }

        pkg[category].pull({ _id: itemId });
        return await pkg.save();
    }

    // Toggle Item Status
    async toggleItemStatus(vendorId, category, itemId, isActive) {
        // Re-use update logic
        return await this.updateServiceItem(vendorId, category, itemId, { isActive });
    }

    async getPackageById(id) {
        return await Package.findById(id);
    }

    async getAvailablePackages(query = '') {
        const filter = {};
        let packages = await Package.find({}).populate('vendor');

        if (query) {
            const regex = new RegExp(query, 'i');
            packages = packages.filter(p => {
                if (p.vendor?.businessName && regex.test(p.vendor.businessName)) return true;

                // Search in all service arrays at root level
                const serviceKeys = ['homestay', 'camping', 'trekking', 'rafting', 'bungeeJumping', 'vehicleRental', 'chardhamTour', 'skiing', 'paragliding'];

                for (let key of serviceKeys) {
                    if (p[key] && Array.isArray(p[key])) {
                        if (p[key].some(s => regex.test(s.name) || regex.test(s.title) || regex.test(s.description))) {
                            return true;
                        }
                    }
                }
                return false;
            });
        }
        return packages;
    }

    // Toggle Category Status (Bulk)
    async toggleCategoryStatus(vendorId, category, isActive) {
        const pkg = await this.ensureCatalog(vendorId);
        if (!pkg[category]) throw new Error(RESPONSE_MESSAGES.ERROR.INVALID_CATEGORY);

        pkg[category].forEach(item => {
            item.isActive = isActive;
        });

        return await pkg.save();
    }
}

const packageService = new PackageService();
export default packageService;