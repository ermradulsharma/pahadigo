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

    async getPackageById(id) {
        return await Package.findById(id);
    }

    async getAvailablePackages(query = '') {
        const filter = {};
        // If query exists, search in package titles or services
        // Since my schema is complex (services map), search is tricky.
        // Assuming we want to search in 'vendor.businessName' or inside services array?
        // For simplicity, let's assume we search in Vendor Business Name (via lookup) or we need a text index.
        // Or if Package has a title? existing Package Schema doesn't have title, it has 'services'.
        // Wait, Package model structure: { vendor: Ref, services: { type: [Schema] } }
        // Each service item has 'name', 'title' etc.
        // Implementing full text search on nested arrays is complex.
        // For now, I'll filter in memory or basic regex on specific visible fields if possible.
        // Actually, let's just return all and let frontend filter? No, standard is API filter.

        // Let's implement basic search on Vendor Business Name for now since we populate it.
        // Or refactor to proper aggregation later.

        let packages = await Package.find({}).populate('vendor');

        if (query) {
            const regex = new RegExp(query, 'i');
            packages = packages.filter(p =>
                (p.vendor?.businessName && regex.test(p.vendor.businessName)) ||
                // Search in services
                Object.values(p.services || {}).flat().some(s => regex.test(s.name) || regex.test(s.title) || regex.test(s.description))
            );
        }
        return packages;
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
