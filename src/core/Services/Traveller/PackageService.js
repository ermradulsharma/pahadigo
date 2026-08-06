import mongoose from 'mongoose';
import Package from '@/core/Models/Package.js';
import Vendor from '@/core/Models/Vendor.js';
import Category from '@/core/Models/Category.js';
import VendorDocument from '@/core/Models/VendorDocument.js';
import { CATEGORY_MAP, SCHEMA_KEYS } from '@/core/Constants/categories.js';
import MasterService from '@/core/Services/MasterService.js';
import { getAppConfig } from '@/core/Lib/appConfig.js';

/**
 * PackageService (Traveller Role)
 * Focuses on retrieval, search, and availability for the customer-facing side.
 */
class PackageService {
    constructor(masterService = MasterService) {
        this.masterService = masterService;
    }

    async getPackageById(id) {
        return await Package.findById(id);
    }

    async getAvailablePackageItem(itemId) {
        const item = await this.getPackageItem(itemId);
        if (!item) return null;

        const pkg = await Package.findById(item.catalogId).populate('vendor').lean();
        if (!pkg || !(await this.masterService.isVendorActive(pkg.vendor))) return null;

        // Check category specific verification for single item
        const slug = Object.keys(CATEGORY_MAP).find(k => CATEGORY_MAP[k] === item.category) || item.category;
        const isCategoryVerified = await VendorDocument.findOne({
            vendor: pkg.vendor._id,
            category_slug: slug,
            status: 'verified'
        });
        if (!isCategoryVerified) return null;

        if (item.isActive === false) return null;

        const config = await getAppConfig();
        if (item.pricing) {
            item.pricing.gst = config.tax?.gst || 0;
            item.pricing.serviceTax = config.tax?.service_tax || 0;
        }

        if (pkg.vendor) {
            item.vendor = {
                id: pkg.vendor._id.toString(),
                ownerName: pkg.vendor.ownerName,
                businessName: pkg.vendor.businessName,
                address: pkg.vendor.address
            };
        }

        return item;
    }

    async getPackageItem(itemId) {
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

    async getMultiplePackageItems(itemIds) {
        if (!itemIds || itemIds.length === 0) return [];
        const objectIds = itemIds.map(id => (typeof id === 'string' ? id : id.toString()));

        const items = await Package.aggregate([
            {
                $project: {
                    items: {
                        $concatArrays: Object.values(SCHEMA_KEYS).map(key => {
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
                    category_key: "$items.category",
                    category_slug: {
                        $switch: {
                            branches: Object.keys(CATEGORY_MAP).map(slug => ({
                                case: { $eq: ["$items.category", CATEGORY_MAP[slug]] },
                                then: slug
                            })),
                            default: "$items.category"
                        }
                    },
                    catalogId: "$items.catalogId"
                }
            }
        ]);

        const config = await getAppConfig();
        const gst = config.tax?.gst || 0;
        const serviceTax = config.tax?.service_tax || 0;

        return items.map(item => ({
            ...item,
            pricing: {
                ...(item.pricing || {}),
                gst: gst,
                serviceTax: serviceTax
            }
        }));
    }

    async getAvailablePackages(query = '') {
        const regex = new RegExp(query, 'i');
        const results = await Package.aggregate([
            {
                $project: {
                    vendor: 1,
                    items: {
                        $concatArrays: Object.values(SCHEMA_KEYS).map(key => {
                            return {
                                $map: {
                                    input: { $ifNull: [`$${key}`, []] },
                                    as: "item",
                                    in: {
                                        $mergeObjects: [
                                            "$$item",
                                            {
                                                category: key,
                                                catalogId: "$_id"
                                            }
                                        ]
                                    }
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
                    let: { packageVendor: "$vendor" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: [
                                        { $toString: "$_id" },
                                        { $toString: "$$packageVendor" }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'vendorProfile'
                }
            },
            { $unwind: { path: '$vendorProfile', preserveNullAndEmptyArrays: true } },
            ...this.masterService.getVendorActiveAggregationStages('vendorProfile'),
            ...this.masterService.getCategoryVerificationStages('items', 'vendorProfile._id'),
            { $match: { "items.isActive": true } },
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

        const config = await getAppConfig();
        const gst = config.tax?.gst || 0;
        const serviceTax = config.tax?.service_tax || 0;

        categories.forEach(cat => {
            const slug = (cat.slug || '').toLowerCase();
            const schemaKey = (CATEGORY_MAP[slug] || slug).toLowerCase();
            result[slug] = flattened.filter(item => {
                const itemCat = (item.category || '').toLowerCase();
                return itemCat === schemaKey || itemCat === slug;
            }).map(item => {
                const pricing = item.pricing || {};
                return {
                    id: item._id,
                    title: item.title,
                    isActive: item.isActive,
                    pricing: {
                        ...pricing,
                        gst: gst,
                        serviceTax: serviceTax
                    },
                    location: item.location || {},
                    photos: item.photos?.[0] || "",
                    category_name: cat.name || "",
                    category_slug: slug,
                    category_id: cat._id || ""
                };
            })
        });
        return result;
    }

    async searchPackages(lat, lng, categorySlug = '', radiusKm = 50) {
        const longitude = parseFloat(lng);
        const latitude = parseFloat(lat);
        const hasCoords = !isNaN(longitude) && !isNaN(latitude);

        const targetSchemaKey = categorySlug ? (CATEGORY_MAP[categorySlug] || categorySlug).toLowerCase() : null;

        const pipeline = [];

        // 1. Initial Match or GeoNear
        if (hasCoords) {
            pipeline.push({
                $geoNear: {
                    near: { type: "Point", coordinates: [longitude, latitude] },
                    distanceField: "distance",
                    maxDistance: parseFloat(radiusKm) * 1000,
                    spherical: true,
                    query: {
                        status: 'active',
                        isOperating: true,
                        isApproved: true
                    }
                }
            });
            pipeline.push({ $replaceRoot: { newRoot: { vendorProfile: "$$ROOT" } } });
        } else {
            pipeline.push({
                $match: {
                    status: 'active',
                    isOperating: true,
                    isApproved: true
                }
            });
            pipeline.push({ $addFields: { distance: null } });
            pipeline.push({ $replaceRoot: { newRoot: { vendorProfile: "$$ROOT" } } });
        }

        // 2. Compliance Stages
        pipeline.push(...this.masterService.getVendorActiveAggregationStages('vendorProfile'));

        // 3. Joins & Flattening
        pipeline.push({
            $lookup: {
                from: 'packages',
                let: { vendorId: "$vendorProfile._id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: [{ $toString: "$vendor" }, { $toString: "$$vendorId" }]
                            }
                        }
                    }
                ],
                as: 'catalog'
            }
        });
        pipeline.push({ $unwind: "$catalog" });
        pipeline.push({
            $project: {
                vendorProfile: 1,
                items: {
                    $concatArrays: Object.values(SCHEMA_KEYS).map(key => ({
                        $map: {
                            input: { $ifNull: [`$catalog.${key}`, []] },
                            as: "item",
                            in: { $mergeObjects: ["$$item", { category: key, catalogId: "$catalog._id" }] }
                        }
                    }))
                }
            }
        });
        pipeline.push({ $unwind: "$items" });

        // 4. Verification & Filtering
        pipeline.push(...this.masterService.getCategoryVerificationStages('items', 'vendorProfile._id'));

        const finalMatch = { "items.isActive": true };
        if (targetSchemaKey) {
            finalMatch["items.category"] = { $regex: new RegExp(`^${targetSchemaKey}$`, 'i') };
        }
        pipeline.push({ $match: finalMatch });

        // 5. Final Projection
        pipeline.push({
            $project: {
                _id: "$items._id",
                title: "$items.title",
                isActive: "$items.isActive",
                pricing: "$items.pricing",
                location: "$items.location",
                photos: "$items.photos",
                category: "$items.category",
                catalogId: "$items.catalogId",
                distance: "$vendorProfile.distance"
            }
        });

        return await Vendor.aggregate(pipeline);
    }
}

export default new PackageService();
