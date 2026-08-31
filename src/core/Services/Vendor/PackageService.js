import Package from '@/core/Models/Package.js';
import Vendor from '@/core/Models/Vendor.js';
import { CATEGORY_MAP, SCHEMA_KEYS } from '@/core/Constants/categories.js';
import InventoryService from '@/core/Services/Vendor/InventoryService.js';
import { formatInventoryItem } from '@/core/Helpers/InventoryHelper.js';
import { RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import { item } from '@/core/Helpers/package.js';
import { getPackageItemById } from '@/core/Helpers/queryHelpers.js';

/**
 * PackageService (Vendor Role) - Comprehensive management of vendor catalogs and service items.
 */
class PackageService {

    // Helper: Find or Create Catalog for Vendor (Composite lookup)
    async ensureCatalog(userId, vendorId) {
        if (!userId || !vendorId) throw new Error(RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS);
        let pkg = await Package.findOne({ user: userId, vendor: vendorId }).lean();
        if (!pkg) {
            const initialData = { user: userId, vendor: vendorId };
            Object.values(SCHEMA_KEYS).forEach(key => { initialData[key] = []; });
            const createdPkg = await Package.create(initialData);
            pkg = createdPkg.toObject ? createdPkg.toObject() : createdPkg;
        }
        return pkg;
    }

    // Helper: Internal catalog ownership verifier
    async _verifyOwnership(id, userId, vendorId) {
        const pkg = await Package.findById(id);
        if (!pkg) throw new Error(RESPONSE_MESSAGES.PACKAGE.CATALOG_NOT_FOUND);
        if (pkg.vendor.toString() !== vendorId.toString() || pkg.user.toString() !== userId.toString()) {
            throw new Error(RESPONSE_MESSAGES.PACKAGE.CATALOG_UNAUTHORIZED);
        }
        return pkg;
    }

    // Helper: Formats inventory items for a vendor catalog
    async _getFormattedInventory(userId, vendorId) {
        const catalog = await this.ensureCatalog(userId, vendorId);
        const vendor = await Vendor.findById(vendorId).select("category").lean();
        const vendorCategories = vendor?.category || [];

        const allItems = [];
        const itemsByCategory = {};

        vendorCategories.forEach(c => {
            const slug = (c.slug || '').trim().toLowerCase();
            const schemaKey = CATEGORY_MAP[slug] || slug;
            const categoryItems = catalog[schemaKey] || [];
            const formatted = categoryItems.map(item => this._formatItem(item, slug, vendorCategories));
            const inventoryFormatted = categoryItems.map(item => formatInventoryItem(item, slug, vendorCategories));

            itemsByCategory[slug] = inventoryFormatted;
            allItems.push(...formatted);
        });

        return { catalog, vendorCategories, itemsByCategory, allItems };
    }

    // Get Catalog
    async getCatalog(userId, vendorId) {
        return await this.ensureCatalog(userId, vendorId);
    }

    // Get Inventory
    async getInventory(userId, vendorId) {
        const { itemsByCategory } = await this._getFormattedInventory(userId, vendorId);
        return itemsByCategory;
    }

    // Find All
    async getPackages(userId, vendorId, page = 1, limit = 10) {
        return await this.findAllPaginated(userId, vendorId, page, limit);
    }

    // Find All Paginated
    async findAllPaginated(userId, vendorId, page = 1, limit = 10) {
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.max(1, parseInt(limit) || 10);

        const { catalog, allItems } = await this._getFormattedInventory(userId, vendorId);
        const total = allItems.length;
        const startIndex = (pageNum - 1) * limitNum;

        return {
            catalogId: catalog._id,
            vendorId: catalog.vendor,
            items: allItems.slice(startIndex, startIndex + limitNum),
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum) || 0
            }
        };
    }

    // Compatibility helper for tests
    async getFormattedVendorCatalog(userId, vendorId) {
        return await this.findAllPaginated(userId, vendorId);
    }

    // Create Package
    async initializeVendorPackage(userId, vendorId) {
        return await this.ensureCatalog(userId, vendorId);
    }

    // Update Package
    async updatePackage(id, userId, vendorId, data) {
        const pkg = await this._verifyOwnership(id, userId, vendorId);
        Object.assign(pkg, data);
        return await pkg.save();
    }

    // Delete Package
    async deletePackage(id, userId, vendorId) {
        await this._verifyOwnership(id, userId, vendorId);
        return await Package.findByIdAndDelete(id);
    }

    // Update Package Status
    async updatePackageStatus(id, userId, vendorId, isActive) {
        const pkg = await this._verifyOwnership(id, userId, vendorId);
        pkg.isActive = isActive;
        return await pkg.save();
    }

    // Helper to format a single catalog item
    _formatItem(item, categorySlug, vendorCategories = []) {
        const itemObj = item.toObject ? item.toObject() : item;
        const category = vendorCategories.find(c => c.slug === categorySlug) || { name: categorySlug, _id: "" };
        return {
            id: itemObj._id,
            title: itemObj.title,
            slug: itemObj.slug,
            isActive: itemObj.isActive,
            availability: itemObj.availability || {},
            pricing: itemObj.pricing || {},
            location: itemObj.location || {},
            photos: itemObj.photos?.[0] || "",
            category_name: category.name || "",
            category_slug: categorySlug,
            category_id: category._id || ""
        };
    }

    // Add Item
    async addItem(userId, businessId, category, itemData) {
        return await item(userId, businessId, category, itemData);
    }

    // Update Item
    async updateItem(userId, businessId, category, itemId, updates) {
        return await item(userId, businessId, category, updates, itemId);
    }

    // Aliases for Service Item calls
    async addServiceItem(userId, vendorId, category, itemData) {
        return await this.addItem(userId, vendorId, category, itemData);
    }

    async updateServiceItem(userId, vendorId, category, itemId, updates) {
        return await this.updateItem(userId, vendorId, category, itemId, updates);
    }

    // Remove Item
    async removeItem(userId, vendorId, category, itemId) {
        const vendor = await Vendor.findById(vendorId).select("_id").lean();
        if (!vendor) throw new Error(RESPONSE_MESSAGES.VENDOR.NOT_FOUND);
        const pkg = await Package.findOne({ user: userId, vendor: vendorId });
        if (!pkg) throw new Error(RESPONSE_MESSAGES.PACKAGE.CATALOG_NOT_FOUND);

        const schemaKey = CATEGORY_MAP[category] || category;
        if (pkg[schemaKey] === undefined) {
            throw new Error(RESPONSE_MESSAGES.CATEGORY.INVALID);
        }

        pkg[schemaKey].pull({ _id: itemId });
        await pkg.save();
        return { itemId, deleted: true };
    }

    // Toggle Item Status
    async toggleItemStatus(userId, vendorId, category, itemId, isActive) {
        return await this.updateItem(userId, vendorId, category, itemId, { isActive });
    }

    // Update range (Vendor Management)
    async updateRange(userId, vendorId, itemId, serviceType, startDate, endDate, settings) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const updates = [];
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            updates.push({ date: new Date(d), ...settings });
        }
        return await InventoryService.update(vendorId, itemId, serviceType, updates);
    }

    // Update category range (Vendor Management)
    async updateCategoryRange(userId, vendorId, serviceType, startDate, endDate, settings) {
        const pkg = await Package.findOne({ user: userId, vendor: vendorId }).lean();
        if (!pkg || !pkg[serviceType]) return null;

        const results = [];
        for (const item of pkg[serviceType]) {
            const res = await this.updateRange(userId, vendorId, item._id, serviceType, startDate, endDate, settings);
            results.push(res);
        }
        return results;
    }

    // Toggle Category Status (Bulk)
    async toggleCategoryStatus(userId, vendorId, category, isActive) {
        const vendor = await Vendor.findById(vendorId).select("_id").lean();
        if (!vendor) throw new Error(RESPONSE_MESSAGES.VENDOR.NOT_FOUND);
        const pkg = await Package.findOne({ user: userId, vendor: vendorId });
        if (!pkg) throw new Error(RESPONSE_MESSAGES.PACKAGE.CATALOG_NOT_FOUND);

        const schemaKey = CATEGORY_MAP[category] || category;
        if (pkg[schemaKey] === undefined) throw new Error(RESPONSE_MESSAGES.ERROR.INVALID_CATEGORY);

        pkg[schemaKey].forEach(item => {
            item.isActive = isActive;
        });

        return await pkg.save();
    }

    // Find Item Details (Unified)
    async findItem(itemId) {
        return await getPackageItemById(itemId);
    }

    async getPackageItem(itemId) {
        return await this.findItem(itemId);
    }

    // Helper for controller
    async getPackageById(id) {
        return await Package.findById(id).lean();
    }
}

export default new PackageService();
