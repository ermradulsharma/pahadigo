import mongoose from 'mongoose';
import Package from '@/core/Models/Package.js';
import Vendor from '@/core/Models/Vendor.js';
import Category from '@/core/Models/Category.js';
import VendorDocument from '@/core/Models/VendorDocument.js';
import { CATEGORY_MAP, SCHEMA_KEYS } from '@/core/Constants/categories.js';
import { STATUS } from '@/core/Constants/index.js';
import MasterService from '@/core/Services/MasterService.js';
import { getAppConfig } from '@/core/Lib/appConfig.js';
import { getItemDetailsPayload } from '@/core/Services/Shared/PackageCore.js';

/**
 * PackageService (General Role)
 * Focuses on public retrieval, search, and availability.
 */
class PackageService {
    constructor(masterService = MasterService) {
        this.masterService = masterService;
    }

    async getPackageById(id) {
        return await Package.findById(id);
    }

    async getAvailablePackageItem(itemId) {
        return await getItemDetailsPayload(itemId, this.masterService);
    }

    async getPackageItem(itemId) {
        if (!itemId) return null;
        let queryId = itemId;
        if (typeof itemId === 'string' && itemId.length === 24) {
            try { queryId = new mongoose.Types.ObjectId(itemId); } catch (e) { }
        }

        const pkg = await Package.findOne({ $or: Object.values(SCHEMA_KEYS).map(key => ({ [`${key}._id`]: queryId })) }).lean();
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
                    pricePerNight: "$items.pricePerNight",
                    pricePerPerson: "$items.pricePerPerson",
                    pricePerDay: "$items.pricePerDay",
                    location: "$items.location",
                    photos: "$items.photos",
                    category_slug: "$items.category",
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

    async getAvailablePackages(query = '', minPrice = 0, maxPrice = null, sort = '') {
        const pipeline = [];

        // 1. Initial Match using Text Index (High Performance)
        if (query) {
            pipeline.push({ $match: { $text: { $search: query } } });
        }

        // 2. Formatting & Unwinding
        pipeline.push({
            $project: {
                vendor: 1,
                items: {
                    $concatArrays: Object.values(SCHEMA_KEYS).map(key => ({
                        $map: {
                            input: { $ifNull: [`$${key}`, []] },
                            as: "item",
                            in: {
                                $mergeObjects: [
                                    "$$item",
                                    { category: key, catalogId: "$_id" }
                                ]
                            }
                        }
                    }))
                }
            }
        });
        pipeline.push({ $unwind: "$items" });

        // 3. Post-unwind filtering (if text search was too broad or needs regex refinement)
        const postUnwindFilters = [];
        if (query) {
            const regex = new RegExp(query, 'i');
            postUnwindFilters.push({
                $or: [
                    { "items.title": regex },
                    { "items.description": regex }
                ]
            });
        }
        if (minPrice > 0 || maxPrice !== null) {
            const priceMatch = {};
            if (minPrice > 0) priceMatch.$gte = minPrice;
            if (maxPrice !== null) priceMatch.$lte = maxPrice;

            postUnwindFilters.push({
                $or: [
                    { "items.pricing.sellingPrice": priceMatch },
                ]
            });
        }

        if (postUnwindFilters.length > 0) {
            pipeline.push({
                $match: {
                    $and: postUnwindFilters
                }
            });
        }

        // Sorting
        if (sort) {
            pipeline.push({
                $addFields: {
                    sortPrice: {
                        $ifNull: ["$items.pricing.sellingPrice", 99999999]
                    }
                }
            });

            if (sort === 'price_asc') {
                pipeline.push({ $sort: { sortPrice: 1 } });
            } else if (sort === 'price_desc') {
                pipeline.push({ $sort: { sortPrice: -1 } });
            }
        }

        const results = await Package.aggregate([
            ...pipeline,
            {
                $lookup: {
                    from: 'vendors',
                    let: { packageVendor: "$vendor" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: [
                                        "$_id",
                                        "$$packageVendor"
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
                    pricePerNight: "$items.pricePerNight",
                    pricePerPerson: "$items.pricePerPerson",
                    pricePerDay: "$items.pricePerDay",
                    location: "$items.location",
                    photos: "$items.photos",
                    category: "$items.category",
                    catalogId: "$items.catalogId",
                    vendorAddressLocation: "$vendorProfile.address.location"
                }
            }
        ]);

        return results;
    }

    async getAvailablePackagesByCategory(query = '', minPrice = 0, maxPrice = null, sort = '') {
        const flattened = await this.getAvailablePackages(query, minPrice, maxPrice, sort);
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
                    pricePerNight: item.pricePerNight,
                    pricePerPerson: item.pricePerPerson,
                    pricePerDay: item.pricePerDay,
                    location: item.location || {},
                    photos: item.photos?.[0] || "",
                    category_name: cat.name || "",
                    category_slug: slug,
                    category_id: cat._id || ""
                };
            });
        });
        return result;
    }

    async searchPackages(lat, lng, categorySlug = '', radiusKm = 50) {
        let longitude = parseFloat(lng);
        let latitude = parseFloat(lat);

        // Auto-correct swapped lat/lng for India coordinates (Lat: 8-37°N, Lng: 68-97°E)
        if (!isNaN(latitude) && !isNaN(longitude) && latitude > 45 && longitude < 45) {
            const temp = latitude;
            latitude = longitude;
            longitude = temp;
        }

        const hasCoords = !isNaN(longitude) && !isNaN(latitude);
        const targetSchemaKey = categorySlug ? (CATEGORY_MAP[categorySlug] || categorySlug).toLowerCase() : null;

        const buildPipeline = (useGeoNear = true) => {
            const pipeline = [];

            // 1. Initial Match or GeoNear
            if (hasCoords && useGeoNear) {
                pipeline.push({
                    $geoNear: {
                        near: { type: "Point", coordinates: [longitude, latitude] },
                        key: "address.location",
                        distanceField: "distance",
                        maxDistance: (parseFloat(radiusKm) || 50) * 1000,
                        spherical: true,
                        query: {
                            status: STATUS.ACTIVE,
                            isOperating: true,
                            isApproved: true
                        }
                    }
                });
                pipeline.push({ $replaceRoot: { newRoot: { vendorProfile: "$$ROOT" } } });
            } else {
                pipeline.push({
                    $match: {
                        status: STATUS.ACTIVE,
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
                    pricePerNight: "$items.pricePerNight",
                    pricePerPerson: "$items.pricePerPerson",
                    pricePerDay: "$items.pricePerDay",
                    location: "$items.location",
                    photos: "$items.photos",
                    category: "$items.category",
                    catalogId: "$items.catalogId",
                    distance: "$vendorProfile.distance"
                }
            });

            return pipeline;
        };

        // Execute primary $geoNear pipeline
        let results = await Vendor.aggregate(buildPipeline(true));

        // Fallback: If $geoNear on Vendor address returned 0 items (e.g. vendor address is [0,0]), fallback to active vendor pipeline
        if (results.length === 0 && hasCoords) {
            results = await Vendor.aggregate(buildPipeline(false));
        }

        return results;
    }
}

export default new PackageService();
