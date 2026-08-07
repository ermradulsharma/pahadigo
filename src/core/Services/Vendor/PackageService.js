import mongoose from 'mongoose';
import Package from '@/core/Models/Package.js';
import Vendor from '@/core/Models/Vendor.js';
import Category from '@/core/Models/Category.js';
import { CATEGORY_MAP, SCHEMA_KEYS } from '@/core/Constants/categories.js';
import InventoryService from '@/core/Services/Vendor/InventoryService.js';
import { formatInventoryItem } from '@/core/Helpers/InventoryHelper.js';
import { RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import { log } from 'console';
import { item } from '@/core/Helpers/package.js';
import { getPackageItemById } from '@/core/Helpers/queryHelpers.js';


class PackageService {

    // Helper: Find or Create Catalog for Vendor (Composite lookup)
    async ensureCatalog(userId, vendorId) {
        if (!userId || !vendorId) throw new Error(RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS);

        let pkg = await Package.findOne({ user: userId, vendor: vendorId });
        if (!pkg) {
            const initialData = {
                user: userId,
                vendor: vendorId
            };
            Object.values(SCHEMA_KEYS).forEach(key => { initialData[key] = []; });
            pkg = await Package.create(initialData);
        }
        return pkg;
    }

    // Get Catalog
    async getCatalog(userId, vendorId) {
        return await this.ensureCatalog(userId, vendorId);
    }

    // Get Inventory
    async getInventory(userId, vendorId) {
        const catalog = await this.ensureCatalog(userId, vendorId);
        const vendor = await Vendor.findById(vendorId);
        const result = {};
        if (vendor && vendor.category && Array.isArray(vendor.category)) {
            vendor.category.forEach(c => {
                const slug = (c.slug || '').trim().toLowerCase();
                const schemaKey = CATEGORY_MAP[slug] || slug;
                const categoryItems = catalog[schemaKey] || [];
                const items = categoryItems.map(item => {
                    return formatInventoryItem(item, slug, vendor.category);
                });
                result[slug] = items;
            });
        }
        return result;
    }

    // Find All
    async getPackages(userId, vendorId, page = 1, limit = 10) {
        return await this.findAllPaginated(userId, vendorId, page, limit);
    }

    // Find All Paginated
    async findAllPaginated(userId, vendorId, page = 1, limit = 10) {
        const catalog = await this.ensureCatalog(userId, vendorId);
        const vendor = await Vendor.findById(vendorId);
        const result = {
            catalogId: catalog._id,
            vendorId: catalog.vendor,
            items: [],
            pagination: {
                total: 0,
                page,
                limit,
                totalPages: 0
            }
        };

        const allItems = [];
        if (vendor && vendor.category && Array.isArray(vendor.category)) {
            vendor.category.forEach(c => {
                const slug = (c.slug || '').trim().toLowerCase();
                const schemaKey = CATEGORY_MAP[slug] || slug;
                const categoryItems = catalog[schemaKey] || [];
                const items = categoryItems.map(item => {
                    return this._formatItem(item, slug, vendor.category);
                });
                allItems.push(...items);
            });
        }
        const total = allItems.length;
        const startIndex = (page - 1) * limit;
        result.items = allItems.slice(startIndex, startIndex + limit);
        result.pagination.total = total;
        result.pagination.totalPages = Math.ceil(total / limit);
        return result;
    }

    // Compatibility helper for tests
    async getFormattedVendorCatalog(userId, vendorId) {
        return await this.findAllPaginated(userId, vendorId);
    }

    // Create Package
    async initializeVendorPackage(userId, vendorId, data = {}) {
        return await this.ensureCatalog(userId, vendorId);
    }

    // Update Package
    async updatePackage(id, userId, vendorId, data) {
        const pkg = await Package.findById(id);
        if (!pkg) throw new Error(RESPONSE_MESSAGES.ERROR.NOT_FOUND);
        if (pkg.vendor.toString() !== vendorId.toString() || pkg.user.toString() !== userId.toString()) {
            throw new Error(RESPONSE_MESSAGES.AUTH.UNAUTHORIZED);
        }
        Object.assign(pkg, data);
        return await pkg.save();
    }

    // Delete Package
    async deletePackage(id, userId, vendorId) {
        const pkg = await Package.findById(id);
        if (!pkg) throw new Error(RESPONSE_MESSAGES.PACKAGE.CATALOG_NOT_FOUND);
        if (pkg.vendor.toString() !== vendorId.toString() || pkg.user.toString() !== userId.toString()) {
            throw new Error(RESPONSE_MESSAGES.PACKAGE.CATALOG_UNAUTHORIZED);
        }
        return await Package.findByIdAndDelete(id);
    }

    // Update Package Status
    async updatePackageStatus(id, userId, vendorId, isActive) {
        const pkg = await Package.findById(id);
        if (!pkg) throw new Error(RESPONSE_MESSAGES.PACKAGE.CATALOG_NOT_FOUND);
        if (pkg.vendor.toString() !== vendorId.toString() || pkg.user.toString() !== userId.toString()) {
            throw new Error(RESPONSE_MESSAGES.PACKAGE.CATALOG_UNAUTHORIZED);
        }
        pkg.isActive = isActive;
        return await pkg.save();
    }


    // Helper to format a single catalog item for general use (Add/Update/List)
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
    async addItem(userId, vendorId, category, itemData) {
        return await item(userId, vendorId, category, itemData);
    }

    // Update Item
    async updateItem(userId, vendorId, category, itemId, updates) {
        return await item(userId, vendorId, category, updates, itemId);
    }

    // Add Service Item
    async addServiceItem(userId, vendorId, category, itemData) {
        return await this.addItem(userId, vendorId, category, itemData);
    }

    // Update Service Item
    async updateServiceItem(userId, vendorId, category, itemId, updates) {
        return await this.updateItem(userId, vendorId, category, itemId, updates);
    }

    // Remove Item
    async removeItem(userId, vendorId, category, itemId) {
        const vendor = await Vendor.findById(vendorId);
        if (!vendor) throw new Error(RESPONSE_MESSAGES.VENDOR.NOT_FOUND);
        const pkg = await this.ensureCatalog(userId, vendorId);
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

    /**
     * Update range (Vendor Management).
     */
    async updateRange(userId, vendorId, itemId, serviceType, startDate, endDate, settings) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const updates = [];
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            updates.push({ date: new Date(d), ...settings });
        }
        return await InventoryService.update(vendorId, itemId, serviceType, updates);
    }

    /**
     * Update category range (Vendor Management).
     */
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
        const vendor = await Vendor.findById(vendorId);
        if (!vendor) throw new Error(RESPONSE_MESSAGES.VENDOR.NOT_FOUND);
        const pkg = await this.ensureCatalog(userId, vendorId);
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

    async getPackageItem(itemId) { return this.findItem(itemId); }

    // Helper for controller
    async getPackageById(id) {
        return await Package.findById(id);
    }
}

export default new PackageService();
