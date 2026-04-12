import mongoose from 'mongoose';
import Package from '@/models/Package.js';
import Vendor from '@/models/Vendor.js';
import Category from '@/models/Category.js';
import { CATEGORY_MAP, SCHEMA_KEYS } from '@/constants/categories.js';
import InventoryService from '@/services/Vendor/InventoryService.js';
import { formatInventoryItem } from '@/helpers/InventoryHelper.js';
import { mapToGeoJSON } from '@/helpers/geoUtils.js';
import { RESPONSE_MESSAGES } from '@/constants/index.js';

class PackageService {
  constructor() {
  }

  // Helper: Find or Create Catalog for Vendor
  async ensureCatalog(id) {
    const vendor = await Vendor.findOne({ $or: [{ user: id }, { _id: id }] });
    if (!vendor) throw new Error("Complete business profile (Business ID) not found in database. Please complete your registration.");
    const userId = vendor.user;
    const businessId = vendor._id;
    let pkg = await Package.findOne({ vendor: userId });
    if (!pkg) {
      const initialData = {
        vendor: userId,
        business: businessId
      };
      SCHEMA_KEYS.forEach(key => { initialData[key] = []; });
      pkg = await Package.create(initialData);
    } else if (!pkg.business) {
      pkg.business = businessId;
      await pkg.save();
    }
    return pkg;
  }

  // Get Catalog
  async getCatalog(vendorId) {
    return await this.ensureCatalog(vendorId);
  }

  // Get Inventory
  async getInventory(vendorId) {
    const catalog = await this.ensureCatalog(vendorId);
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
  async getPackages(vendorId, page = 1, limit = 10) {
    return await this.findAllPaginated(vendorId, page, limit);
  }

  // Find All Paginated
  async findAllPaginated(vendorId, page = 1, limit = 10) {
    const catalog = await this.ensureCatalog(vendorId);
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
  async getFormattedVendorCatalog(vendorId) {
    return await this.findAllPaginated(vendorId);
  }

  // Create Package
  async initializeVendorPackage(vendorId, data = {}) {
    return await this.ensureCatalog(vendorId);
  }

  // Update Package
  async updatePackage(id, vendorId, data) {
    const pkg = await Package.findById(id);
    if (!pkg) throw new Error("Package not found");
    if (pkg.vendor.toString() !== vendorId.toString()) {
      throw new Error("Unauthorized access to this package catalog");
    }
    Object.assign(pkg, data);
    return await pkg.save();
  }

  // Delete Package
  async deletePackage(id, vendorId) {
    const pkg = await Package.findById(id);
    if (!pkg) throw new Error("Package not found");
    if (pkg.vendor.toString() !== vendorId.toString()) {
      throw new Error("Unauthorized access to this package catalog");
    }
    return await Package.findByIdAndDelete(id);
  }

  // Update Package Status
  async updatePackageStatus(id, vendorId, isActive) {
    const pkg = await Package.findById(id);
    if (!pkg) throw new Error("Package not found");
    if (pkg.vendor.toString() !== vendorId.toString()) {
      throw new Error("Unauthorized access to this package catalog");
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
  async addItem(vendorId, category, itemData) {
    const vendor = await Vendor.findById(vendorId);
    if (!vendor || !vendor.category) throw new Error("Vendor not found");
    const allowedCategories = await this._getAllowedCategories(vendorId);
    if (!allowedCategories.includes(category)) {
      throw new Error(`Vendor not authorized to create items in category: ${category}`);
    }
    const pkg = await this.ensureCatalog(vendor.user);
    const schemaKey = CATEGORY_MAP[category] || category;
    if (pkg[schemaKey] === undefined) {
      throw new Error(RESPONSE_MESSAGES.ERROR.INVALID_CATEGORY);
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

  async addServiceItem(vendorId, category, itemData) { return this.addItem(vendorId, category, itemData); }

  // Update Item
  async updateItem(vendorId, category, itemId, updates) {
    const vendor = await Vendor.findById(vendorId);
    if (!vendor || !vendor.category) throw new Error("Vendor not found");
    const allowedCategories = await this._getAllowedCategories(vendorId);
    if (!allowedCategories.includes(category)) {
      throw new Error(`Vendor not authorized to update items in category: ${category}`);
    }
    const pkg = await this.ensureCatalog(vendor.user);
    const schemaKey = CATEGORY_MAP[category] || category;
    if (pkg[schemaKey] === undefined) {
      throw new Error(RESPONSE_MESSAGES.ERROR.INVALID_CATEGORY);
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

  async updateServiceItem(vendorId, category, itemId, updates) { return this.updateItem(vendorId, category, itemId, updates); }

  // Remove Item
  async removeItem(vendorId, category, itemId) {
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) throw new Error("Vendor not found");
    const pkg = await this.ensureCatalog(vendor.user);
    const schemaKey = CATEGORY_MAP[category] || category;
    if (pkg[schemaKey] === undefined) {
      throw new Error(RESPONSE_MESSAGES.ERROR.INVALID_CATEGORY);
    }

    pkg[schemaKey].pull({ _id: itemId });
    await pkg.save();
    return { itemId, deleted: true };
  }

  // Toggle Item Status
  async toggleItemStatus(vendorId, category, itemId, isActive) {
    return await this.updateItem(vendorId, category, itemId, { isActive });
  }

  /**
   * Update range (Vendor Management).
   */
  async updateRange(vendorId, itemId, serviceType, startDate, endDate, settings) {
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
  async updateCategoryRange(vendorId, serviceType, startDate, endDate, settings) {
    const pkg = await Package.findOne({ vendor: vendorId }).lean();
    if (!pkg || !pkg[serviceType]) return null;

    const results = [];
    for (const item of pkg[serviceType]) {
      const res = await this.updateRange(vendorId, item._id, serviceType, startDate, endDate, settings);
      results.push(res);
    }
    return results;
  }

  // Toggle Category Status (Bulk)
  async toggleCategoryStatus(vendorId, category, isActive) {
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) throw new Error("Vendor not found");
    const pkg = await this.ensureCatalog(vendor.user);
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
      $or: SCHEMA_KEYS.map(key => ({ [`${key}._id`]: queryId }))
    }).lean();

    if (!pkg) return null;

    for (const key of SCHEMA_KEYS) {
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
