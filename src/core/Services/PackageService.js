import mongoose from 'mongoose';
import Package from '@/models/Package.js';
import Vendor from '@/models/Vendor.js';
import Category from '@/models/Category.js';
import VendorClosure from '@/models/VendorClosure.js';
import { CATEGORY_MAP, SCHEMA_KEYS } from '@/constants/categories.js';
import VendorStatusService from '@/services/VendorStatusService.js';

/**
 * PackageService (General/Traveller Role)
 * Focuses on retrieval, search, and availability for the customer-facing side.
 */
class PackageService {
    constructor(vendorStatusService = VendorStatusService) {
        this.vendorStatusService = vendorStatusService;
    }

    async getPackageById(id) {
        return await Package.findById(id);
    }

    async getAvailablePackageItem(itemId) {
        const item = await this.getPackageItem(itemId);
        if (!item) return null;

        const pkg = await Package.findById(item.catalogId).lean();
        if (!pkg || !(await this.vendorStatusService.isVendorAvailable(pkg.vendor))) return null;

        if (item.isActive === false) return null;
        return item;
    }

    async getPackageItem(itemId) {
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
            { $match: { "items._id": { $in: objectIds.map(id => new mongoose.Types.ObjectId(id)) } } },
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

    async getAvailablePackages(query = '') {
        const regex = new RegExp(query, 'i');
        const results = await Package.aggregate([
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
            {
                $match: query ? {
                    $or: [
                        { "items.title": regex },
                        { "items.description": regex }
                    ]
                } : {}
            },
            {
                $lookup: {
                    from: 'vendors',
                    localField: 'vendor',
                    foreignField: 'user',
                    as: 'vendorProfile'
                }
            },
            { $unwind: { path: '$vendorProfile', preserveNullAndEmptyArrays: true } },
            { $match: { "items.isActive": true } },
            ...this.vendorStatusService.getVendorClosureFilterStages('vendorProfile'),
            {
                $project: {
                    _id: "$items._id",
                    title: "$items.title",
                    isActive: "$items.isActive",
                    pricing: "$items.pricing",
                    location: "$items.location",
                    photos: "$items.photos",
                    category: "$items.category",
                    catalogId: "$items.catalogId"
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

        if (isNaN(longitude) || isNaN(latitude)) throw new Error("Invalid coordinates");

        const nearbyVendors = await Vendor.find({
            'address.location': {
                $near: {
                    $geometry: { type: "Point", coordinates: [longitude, latitude] },
                    $maxDistance: parseFloat(radiusKm) * 1000
                }
            },
            ...this.vendorStatusService.getVendorClosureQuery()
        }).lean();

        if (nearbyVendors.length === 0) return [];

        const vendorUserIds = nearbyVendors.map(v => v.user.toString());
        const catalogs = await Package.find({ vendor: { $in: vendorUserIds } }).lean();
        const results = [];
        const targetSchemaKey = categorySlug ? (CATEGORY_MAP[categorySlug] || categorySlug).toLowerCase() : null;

        catalogs.forEach(cat => {
            Object.keys(cat).forEach(key => {
                const lowerKey = key.toLowerCase();
                if (targetSchemaKey && lowerKey !== targetSchemaKey) return;
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
}

export default new PackageService();
