import Package from '@/models/Package.js';
import Vendor from '@/models/Vendor.js';
import Category from '@/models/Category.js';
import User from '@/models/User.js';
import VendorClosure from '@/models/VendorClosure.js';
import { RESPONSE_MESSAGES } from '@/constants/index.js';
import { CATEGORY_MAP, SCHEMA_KEYS } from '@/constants/categories.js';
import InventoryService from '@/services/InventoryService.js';
import VendorStatusService from '@/services/VendorStatusService.js';
import { formatInventoryItem } from '@/helpers/InventoryHelper.js';

class PackageService {
    constructor(vendorStatusService = VendorStatusService) {
        this.vendorStatusService = vendorStatusService;
    }

    // Helper: Find or Create Catalog for Vendor
    async ensureCatalog(vendorId) {
        let pkg = await Package.findOne({ vendor: vendorId });
        if (!pkg) {
            // Find the Vendor record to get its _id for the 'business' field
            const vendor = await Vendor.findOne({ user: vendorId });
            if (!vendor) throw new Error("Vendor profile not found. Please create a business profile first.");

            const initialData = { 
                vendor: vendorId,
                business: vendor._id // Link to the Vendor document
            };
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

    async getVendorInventoryCatalog(vendorId) {
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

    async getFormattedVendorCatalog(vendorId, page = 1, limit = 10) {
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

    // Add Item to Specific Service Array
    async addServiceItem(vendorId, category, itemData) {
        const vendor = await Vendor.findById(vendorId);
        if (!vendor || !vendor.category) throw new Error("Vendor not found");

        const allowedCategories = await this._getAllowedCategories(vendorId);
        if (!allowedCategories.includes(category)) {
            throw new Error(`Vendor not authorized to create items in category: ${category}`);
        }
        const pkg = await this.ensureCatalog(vendorId);
        if (!pkg[category]) {
            throw new Error(RESPONSE_MESSAGES.ERROR.INVALID_CATEGORY);
        }
        pkg[category].push(itemData);
        const saved = await pkg.save();

        const newItem = saved[category][saved[category].length - 1];
        if (newItem && newItem._id) {
            // Auto-initialize inventory
            try {
                await InventoryService.initializeFromItem(vendorId, newItem._id, category);
            } catch (invError) {
                console.error('Inventory Initialization Failed:', invError);
            }
        }

        return this._formatItem(newItem, category, vendor.category);
    }

    // Update Item in Service Array
    async updateServiceItem(vendorId, category, itemId, updates) {
        const vendor = await Vendor.findById(vendorId);
        if (!vendor || !vendor.category) throw new Error("Vendor not found");

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
        const saved = await pkg.save();
        const updatedItem = saved[category].id(itemId);

        return this._formatItem(updatedItem, category, vendor.category);
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
        await pkg.save();
        return { itemId, deleted: true };
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

        // Check vendor availability using the injected service
        if (!(await this.vendorStatusService.isVendorAvailable(pkg.vendor))) return null;

        for (const key of SCHEMA_KEYS) {
            if (Array.isArray(pkg[key])) {
                const item = pkg[key].find(i => i._id.toString() === itemId);
                if (item && item.isActive !== false) {
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

    // [NEW] Bulk Retrieval to prevent N+1 issues
    async getMultiplePackageItems(itemIds) {
        if (!itemIds || itemIds.length === 0) return [];
        const objectIds = itemIds.map(id => (typeof id === 'string' ? id : id.toString()));

        return await Package.aggregate([
            {
                $project: {
                    items: {
                        $concatArrays: SCHEMA_KEYS.map(key => {
                            return {
                                $map: {
                                    input: { $ifNull: [`$${key}`, []] },
                                    as: "item",
                                    in: { $mergeObjects: ["$$item", { category: key, catalogId: "$_id" }] }
                                }
                            };
                        })
                    }
                }
            },
            { $unwind: "$items" },
            { $match: { "items._id": { $in: objectIds.map(id => new (require('mongoose')).Types.ObjectId(id)) } } },
            {
                $project: {
                    id: "$items._id",
                    title: "$items.title",
                    isActive: "$items.isActive",
                    pricing: "$items.pricing",
                    location: "$items.location",
                    photos: "$items.photos",
                    category_slug: "$items.category",
                    catalogId: "$items.catalogId"
                }
            }
        ]);
    }

    async getGranularItem(catalogId, category, itemId) {
        const pkg = await Package.findById(catalogId);
        if (!pkg || !pkg[category]) return null;
        return pkg[category].id(itemId);
    }

    async getAvailablePackages(query = '') {
        const regex = new RegExp(query, 'i');

        // [PERFORMANCE] Use aggregation to join data in DB instead of memory
        const results = await Package.aggregate([
            // 1. Project and concat all arrays into one for search
            {
                $project: {
                    vendor: 1,
                    items: {
                        $concatArrays: SCHEMA_KEYS.map(key => {
                            return {
                                $map: {
                                    input: { $ifNull: [`$${key}`, []] },
                                    as: "item",
                                    in: { $mergeObjects: ["$$item", { category: key, catalogId: "$_id" }] }
                                }
                            };
                        })
                    }
                }
            },
            { $unwind: "$items" },
            // 2. Filter by query if provided
            {
                $match: query ? {
                    $or: [
                        { "items.title": regex },
                        { "items.description": regex }
                    ]
                } : {}
            },
            // 3. Join with Users (Vendor role)
            {
                $lookup: {
                    from: 'users',
                    localField: 'vendor',
                    foreignField: '_id',
                    pipeline: [{ $project: { password: 0 } }], // Securely exclude password
                    as: 'userInfo'
                }
            },
            { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } },
            // 4. Join with Vendors table for business details
            {
                $lookup: {
                    from: 'vendors',
                    localField: 'vendor',
                    foreignField: 'user',
                    as: 'vendorProfile'
                }
            },
            { $unwind: { path: '$vendorProfile', preserveNullAndEmptyArrays: true } },
            // 5. Active Item & Vendor Availability Filtering
            { $match: { "items.isActive": true } },
            ...this.vendorStatusService.getVendorClosureFilterStages('vendorProfile'),
            // 6. Final Projection
            {
                $project: {
                    _id: "$items._id",
                    title: "$items.title",
                    isActive: "$items.isActive",
                    pricing: "$items.pricing",
                    location: "$items.location",
                    photos: "$items.photos",
                    category: "$items.category",
                    catalogId: "$items.catalogId",
                    vendor: {
                        $cond: {
                            if: { $ifNull: ["$vendorProfile", false] },
                            then: { $mergeObjects: ["$userInfo", "$vendorProfile"] }, // Favors profile
                            else: { $ifNull: ["$userInfo", { name: "System Partner" }] }
                        }
                    }
                }
            }
        ]);

        return results;
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

        // 1. Find nearby vendors (active status)
        const nearbyVendors = await Vendor.find({
            'address.location': {
                $near: {
                    $geometry: { type: "Point", coordinates: [longitude, latitude] },
                    $maxDistance: parseFloat(radiusKm) * 1000 // meters
                }
            },
            ...this.vendorStatusService.getVendorClosureQuery()
        }).lean();

        if (nearbyVendors.length === 0) return [];

        // 2. Filter out vendors who have an active closure period
        const vendorIds = nearbyVendors.map(v => v._id);
        const now = new Date();
        const activeClosures = await VendorClosure.find({
            vendor: { $in: vendorIds },
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now }
        }).lean();

        const closedVendorIds = new Set(activeClosures.map(c => c.vendor.toString()));
        const availableVendors = nearbyVendors.filter(v => !closedVendorIds.has(v._id.toString()));

        if (availableVendors.length === 0) return [];

        const vendorUserIds = availableVendors.map(v => (v._id).toString());
        const vendorMap = availableVendors.reduce((acc, v) => {
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
                        if (item.isActive !== false) {
                            results.push({
                                ...item,
                                category: key,
                                catalogId: cat._id.toString(),
                            });
                        }
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
