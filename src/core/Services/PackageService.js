import Package from '@/models/Package.js';
import Vendor from '@/models/Vendor.js';
import Category from '@/models/Category.js';
import User from '@/models/User.js';
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

        const result = { 
            catalogId: catalog._id,
            vendorId: catalog.vendor,
            services: [] 
        };

        if (vendor && vendor.category && Array.isArray(vendor.category)) {
            vendor.category.forEach(c => {
                const slug = (c.slug || '').trim().toLowerCase();
                const schemaKey = CATEGORY_MAP[slug] || slug;
                const categoryItems = catalog[schemaKey] || [];

                const items = categoryItems.map(item => {
                    const itemObj = item.toObject ? item.toObject() : item;
                    return {
                        id: itemObj._id,
                        title: itemObj.title,
                        isActive: itemObj.isActive,
                        pricing: itemObj.pricing || {},
                        location: itemObj.location || {},
                        photos: itemObj.photos?.[0] || "",
                        category_name: c.name || "",
                        category_slug: slug,
                        category_id: c._id || ""
                    };
                });

                result.services.push({
                    name: c.name,
                    slug: slug,
                    items: items
                });
            });
        }

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

    async getAvailablePackageItem(itemId) {
        const pkg = await Package.findOne({
            $or: SCHEMA_KEYS.map(key => ({ [`${key}._id`]: itemId }))
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

    async getGranularItem(catalogId, category, itemId) {
        const pkg = await Package.findById(catalogId);
        if (!pkg || !pkg[category]) return null;
        return pkg[category].id(itemId);
    }

    async getAvailablePackages(query = '') {
        const regex = new RegExp(query, 'i');

        // Fetch all records for maximum visibility in dev
        const catalogs = await Package.find({}).lean();
        const vendors = await Vendor.find({}).lean();
        const users = await User.find({ role: 'vendor' }).lean();

        // Map vendors by User ID
        const vendorMap = vendors.reduce((acc, v) => {
            const uId = v.user?.toString();
            if (uId) acc[uId] = v;
            return acc;
        }, {});

        // Map users as fallback
        const userMap = users.reduce((acc, u) => {
            acc[u._id?.toString()] = u;
            return acc;
        }, {});

        const flattened = [];
        catalogs.forEach(cat => {
            const vendorIdString = cat.vendor?.toString();
            // Try Vendor table first, then fallback to User table, or default
            const vendorInfo = vendorMap[vendorIdString] || userMap[vendorIdString] || { name: "System Partner" };

            // Look for ANY array in the document that might contain packages
            Object.keys(cat).forEach(key => {
                // Skip metadata keys
                if (['_id', 'vendor', 'createdAt', 'updatedAt', '__v'].includes(key)) return;

                if (Array.isArray(cat[key])) {
                    cat[key].forEach(item => {
                        const matchesQuery = !query || regex.test(item.title || item.name || item.businessName || '');

                        if (matchesQuery) {
                            flattened.push({
                                ...item,
                                category: key,
                                catalogId: cat._id.toString(),
                                vendor: vendorInfo // Now includes vendor context
                            });
                        }
                    });
                }
            });
        });
        return flattened;
    }

    async getAvailablePackagesByCategory(query = '') {
        const flattened = await this.getAvailablePackages(query);
        const categories = await Category.find({}).lean();

        const result = {};

        categories.forEach(cat => {
            const slug = (cat.slug || '').toLowerCase();
            const schemaKey = (CATEGORY_MAP[slug] || slug).toLowerCase();
            result[slug] = flattened.filter(item => {
                const itemCat = (item.category || '').toLowerCase();
                return itemCat === schemaKey || itemCat === slug;
            }).map(item => ({
                id: item._id,
                title: item.title,
                isActive: item.isActive,
                pricing: item.pricing || {},
                location: item.location || {},
                photos: item.photos?.[0] || "",
                category_name: cat.name || "",
                category_slug: slug,
                category_id: cat._id || ""
            }))
        });
        return result;
    }

    async searchNearbyPackages(lat, lng, categorySlug = '', radiusKm = 50) {
        const longitude = parseFloat(lng);
        const latitude = parseFloat(lat);

        if (isNaN(longitude) || isNaN(latitude)) {
            throw new Error("Invalid coordinates provided");
        }

        // 1. Find nearby vendors
        const nearbyVendors = await Vendor.find({
            'address.location': {
                $near: {
                    $geometry: { type: "Point", coordinates: [longitude, latitude] },
                    $maxDistance: parseFloat(radiusKm) * 1000 // meters
                }
            }
        }).lean();
        if (nearbyVendors.length === 0) return [];

        const vendorUserIds = nearbyVendors.map(v => (v._id).toString());
        const vendorMap = nearbyVendors.reduce((acc, v) => {
            const uId = (v._id).toString();
            acc[uId] = v;
            return acc;
        }, {});

        // 2. Fetch packages for these vendors
        const catalogs = await Package.find({ vendor: { $in: vendorUserIds } }).lean();
        const results = [];

        // Determine which schema key to look into
        const targetSchemaKey = categorySlug ? (CATEGORY_MAP[categorySlug] || categorySlug).toLowerCase() : null;

        catalogs.forEach(cat => {
            const vendorId = (cat.vendor?._id || cat.vendor).toString();
            const vendorInfo = vendorMap[vendorId];
            if (!vendorInfo) return;

            Object.keys(cat).forEach(key => {
                const lowerKey = key.toLowerCase();
                // If category filter is provided, only look in that key
                if (targetSchemaKey && lowerKey !== targetSchemaKey) return;

                // Skip non-item keys
                if (['_id', 'vendor', 'createdAt', 'updatedAt', '__v'].includes(key)) return;

                if (Array.isArray(cat[key])) {
                    cat[key].forEach(item => {
                        results.push({
                            ...item,
                            category: key,
                            catalogId: cat._id.toString(),
                        });
                    });
                }
            });
        });

        return results;
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
