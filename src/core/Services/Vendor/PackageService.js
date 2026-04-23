import mongoose from 'mongoose';
import Package from '@/core/Models/Package.js';
import Vendor from '@/core/Models/Vendor.js';
import Category from '@/core/Models/Category.js';
import { CATEGORY_MAP, SCHEMA_KEYS } from '@/core/Constants/categories.js';
import InventoryService from '@/core/Services/Vendor/InventoryService.js';
import { formatInventoryItem } from '@/core/Helpers/InventoryHelper.js';
import { mapToGeoJSON } from '@/core/Helpers/geoUtils.js';
import { RESPONSE_MESSAGES } from '@/core/Constants/index.js';

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

  // Helper to get allowed categories (slugs + normalized keys) for a vendor
  async _getAllowedCategories(vendorId) {
    const vendor = await Vendor.findById(vendorId);
    if (!vendor || !vendor.category) return [];
    const allowed = new Set();
    vendor.category.forEach(c => {
      if (!c.slug) return;
      const slug = c.slug.toLowerCase();
      allowed.add(slug);
      if (CATEGORY_MAP[slug]) {
        allowed.add(CATEGORY_MAP[slug]);
      }
    });
    return Array.from(allowed);
  }

  // Helper to format a single catalog item for general use (Add/Update/List)
  _formatItem(item, categorySlug, vendorCategories = []) {
    const itemObj = item.toObject ? item.toObject() : item;
    const category = vendorCategories.find(c => c.slug === categorySlug) || { name: categorySlug, _id: "" };
    return {
      id: itemObj._id,
      title: itemObj.title,
      isActive: itemObj.isActive,
      pricing: itemObj.pricing || {},
      availability: itemObj.availability || {},
      fleetAvailability: itemObj.fleetAvailability || {},
      location: itemObj.location || {},
      photos: itemObj.photos?.[0] || "",
      category_name: category.name || "",
      category_slug: categorySlug,
      category_id: category._id || ""
    };
  }

  // Add Item
  async addItem(userId, vendorId, category, itemData) {
    const vendor = await Vendor.findById(vendorId);
    if (!vendor || !vendor.category) throw new Error(RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

    const allowedCategories = await this._getAllowedCategories(vendorId);
    if (!allowedCategories.includes(category)) {
      throw new Error(`Vendor not authorized to create items in category: ${category}`);
    }

    const pkg = await this.ensureCatalog(userId, vendorId);
    const schemaKey = CATEGORY_MAP[category] || category;
    if (pkg[schemaKey] === undefined) {
      throw new Error(RESPONSE_MESSAGES.CATEGORY.INVALID);
    }
    const index = pkg[schemaKey].push(itemData) - 1;
    const newItemDoc = pkg[schemaKey][index];
    if (newItemDoc.location) {
      mapToGeoJSON(newItemDoc.location);
    }
    const saved = await pkg.save();
    const newItem = saved[schemaKey][saved[schemaKey].length - 1];
    if (newItem && newItem._id) {
      try {
        await InventoryService.initializeFromItem(vendorId, newItem._id, schemaKey);
      } catch (invError) {
        console.error('Inventory Initialization Failed:', invError);
      }
    }
    return this._formatItem(newItem, category, vendor.category);
  }

  async addServiceItem(userId, vendorId, category, itemData) { return this.addItem(userId, vendorId, category, itemData); }

  // Update Item
  async updateItem(userId, vendorId, category, itemId, updates) {
    const vendor = await Vendor.findById(vendorId);
    if (!vendor || !vendor.category) throw new Error(RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

    const allowedCategories = await this._getAllowedCategories(vendorId);
    if (!allowedCategories.includes(category)) {
      throw new Error(`Vendor not authorized to update items in category: ${category}`);
    }
    const pkg = await this.ensureCatalog(userId, vendorId);
    const schemaKey = CATEGORY_MAP[category] || category;
    if (pkg[schemaKey] === undefined) {
      throw new Error(RESPONSE_MESSAGES.CATEGORY.INVALID);
    }
    const item = pkg[schemaKey].id(itemId);
    if (!item) throw new Error(RESPONSE_MESSAGES.ITEM.NOT_FOUND);

    // Support nested dot-notation for pricing updates etc.
    Object.keys(updates).forEach(key => {
      if (key.includes('.')) {
        const parts = key.split('.');
        let current = item;
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) current[parts[i]] = {};
          current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = updates[key];
      } else {
        item.set(key, updates[key]);
      }
    });

    if (item.location) {
      mapToGeoJSON(item.location);
    }
    const saved = await pkg.save();
    const updatedItem = saved[schemaKey].id(itemId);
    return this._formatItem(updatedItem, category, vendor.category);
  }

  async updateServiceItem(userId, vendorId, category, itemId, updates) { return this.updateItem(userId, vendorId, category, itemId, updates); }

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
    if (!itemId) return null;
    let queryId = itemId;
    if (typeof itemId === 'string' && itemId.length === 24) {
      try { queryId = new mongoose.Types.ObjectId(itemId); } catch (e) { }
    }

    const pkg = await Package.findOne({
      $or: Object.values(SCHEMA_KEYS).map(key => ({ [`${key}._id`]: queryId }))
    }).lean();

    if (!pkg) return null;

    for (const key of Object.values(SCHEMA_KEYS)) {
      if (Array.isArray(pkg[key])) {
        const item = pkg[key].find(i => i._id.toString() === itemId);
        if (item) {
          return {
            ...item,
            category: key,
            catalogId: pkg._id.toString()
          };
        }
      }
    }
    return null;
  }

  async getPackageItem(itemId) { return this.findItem(itemId); }

  // Helper for controller
  async getPackageById(id) {
    return await Package.findById(id);
  }
}

export default new PackageService();
