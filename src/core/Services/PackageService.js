import Package from '@/models/Package.js';
import Vendor from '@/models/Vendor.js';
import { RESPONSE_MESSAGES } from '@/constants/index.js';
import { CATEGORY_MAP, SCHEMA_KEYS } from '@/constants/categories.js';

class PackageService {

  // Helper: Find or Create Catalog for Vendor
  async ensureCatalog(vendorId) {
    let pkg = await Package.findOne({ vendor: vendorId });
    if (!pkg) {
      const initialData = { vendor: vendorId };
      SCHEMA_KEYS.forEach(key => {
        initialData[key] = [];
      });
      pkg = await Package.create(initialData);
    }
    return pkg;
  }

  async getVendorCatalog(vendorId) {
    return await this.ensureCatalog(vendorId);
  }

  async getFormattedVendorCatalog(vendorId) {
    const catalog = await this.ensureCatalog(vendorId);
    const vendor = await Vendor.findById(vendorId);

    const result = catalog.toObject();
    result.items = [];

    if (vendor && vendor.category && Array.isArray(vendor.category)) {
      vendor.category.forEach(c => {
        const slug = (c.slug || '').trim().toLowerCase();
        const schemaKey = CATEGORY_MAP[slug] || slug;
        const categoryItems = catalog[schemaKey] || [];

        categoryItems.forEach(item => {
          const itemObj = item.toObject ? item.toObject() : item;
          result.items.push({
            id: itemObj._id,
            title: itemObj.title,
            isActive: itemObj.isActive,
            pricing: itemObj.pricing || {},
            location: itemObj.location || {},
            photos: itemObj.photos[0] || "",
            category_name: c.name || "",
            category_slug: slug,
            category_id: c._id || ""
          });
        });
      });
    }

    // Clean up individual root-level category keys to provide a clean response
    SCHEMA_KEYS.forEach(key => {
      if (result[key]) delete result[key];
    });

    return result;
  }

  async createPackage(vendorId, data = {}) {
    return await this.ensureCatalog(vendorId);
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
      // Also allow the normalized schema key
      if (CATEGORY_MAP[slug]) {
        allowed.add(CATEGORY_MAP[slug]);
      }
    });

    return Array.from(allowed);
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

    item.set(updates);
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

  async getGranularItem(catalogId, category, itemId) {
    const pkg = await Package.findById(catalogId);
    if (!pkg || !pkg[category]) return null;
    return pkg[category].id(itemId);
  }

  async getAvailablePackages(query = '') {
    const regex = new RegExp(query, 'i');

    // Aggregation to flatten all service arrays into a single list of items
    const pipeline = [
      {
        $lookup: {
          from: 'vendors',
          localField: 'vendor',
          foreignField: '_id',
          as: 'vendorDetails'
        }
      },
      { $unwind: '$vendorDetails' }
    ];

    // We will perform the matching in JS below to avoid complex $text and $lookup issues.

    const catalogs = await Package.aggregate(pipeline);

    const flattened = [];
    catalogs.forEach(cat => {
      SCHEMA_KEYS.forEach(key => {
        if (cat[key] && Array.isArray(cat[key])) {
          cat[key].forEach(item => {
            // filter by query again if needed or rely on aggregation
            if (!query || regex.test(item.title || item.name || '')) {
              flattened.push({
                ...item,
                category: key,
                catalogId: cat._id,
                vendor: cat.vendorDetails
              });
            }
          });
        }
      });
    });

    return flattened;
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
