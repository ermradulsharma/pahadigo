import mongoose from 'mongoose';
import Package from '@/core/Models/Package.js';
import Vendor from '@/core/Models/Vendor.js';
import VendorClosure from '@/core/Models/VendorClosure.js';
import VendorDocument from '@/core/Models/VendorDocument.js';
import Category from '@/core/Models/Category.js';
import { CATEGORY_MAP, SCHEMA_KEYS } from '@/core/Constants/categories.js';
import { STATUS, VERIFICATION_STATUS, VENDOR_PROFILE_TYPES } from '@/core/Constants/index.js';
import MasterService from '@/core/Services/MasterService.js';
import { getPackageItemById } from '@/core/Helpers/queryHelpers.js';
import { addressPayload, getLocationPoint } from '@/core/Helpers/addressHelper.js';
import {
    getItemDetailsPayload,
    getFlattenPackageItemsStages,
    getReviewsLookupStage,
    getVendorProfileLookupStages,
    getPackageItemProjectionStage,
    normalizeCoordinates,
    getTaxConfig,
    applyTaxesToPricing,
    enrichItemsWithTaxes,
    calculateDistanceKm
} from '@/core/Services/Shared/PackageCore.js';

// In-memory 5-minute cache for static Category master data
let cachedCategories = null;
let lastCategoryFetchTime = 0;
const CATEGORY_CACHE_TTL_MS = 5 * 60 * 1000;

async function getCachedCategories() {
    const now = Date.now();
    if (cachedCategories && (now - lastCategoryFetchTime < CATEGORY_CACHE_TTL_MS)) {
        return cachedCategories;
    }
    cachedCategories = await Category.find({}).lean();
    lastCategoryFetchTime = now;
    return cachedCategories;
}

// In-memory 120-second (2 minutes) cache for browse packages results (instant repeated requests)
const browseCache = new Map();
const BROWSE_CACHE_TTL_MS = 120 * 1000;

function getBrowseCacheKey(params) {
    return [
        params.query || '',
        params.category || '',
        params.minPrice || 0,
        params.maxPrice ?? '',
        params.sort || '',
        params.lat ?? '',
        params.lng ?? '',
        params.radius || 50,
        params.address || '',
        params.userId || ''
    ].join('::');
}

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
        return await getPackageItemById(itemId);
    }

    async getMultiplePackageItems(itemIds) {
        if (!itemIds || itemIds.length === 0) return [];
        const objectIds = itemIds.map(id => (typeof id === 'string' ? id : id.toString()));

        const items = await Package.aggregate([
            ...getFlattenPackageItemsStages(),
            { $match: { "items._id": { $in: objectIds.map(id => new mongoose.Types.ObjectId(id)) } } },
            getReviewsLookupStage("$items._id"),
            getPackageItemProjectionStage({ category_slug: "$items.category" }, 'id')
        ]);

        return await enrichItemsWithTaxes(items);
    }

    async getAvailablePackages(query = '', minPrice = 0, maxPrice = null, sort = '') {
        const pipeline = [];
        if (query) pipeline.push({ $match: { $text: { $search: query } } });
        pipeline.push(...getFlattenPackageItemsStages({ extraProjectFields: { vendor: 1 } }));

        // Post-unwind filtering (if text search was too broad or needs regex refinement)
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
            ...getVendorProfileLookupStages('$vendor'),
            ...this.masterService.getVendorActiveAggregationStages('vendorProfile'),
            ...this.masterService.getCategoryVerificationStages('items', 'vendorProfile._id'),
            { $match: { "items.isActive": true } },
            getReviewsLookupStage("$items._id"),
            getPackageItemProjectionStage({
                vendorAddressLocation: "$vendorProfile.address.location"
            })
        ]);

        return results;
    }

    /**
     * Complete browsing and filtering logic for public packages.
     * Fulfills all 6 core business requirements:
     * 1. Vendor Basic (active, isOperating, isApproved)
     * 2. Vendor KYC (PAN + Aadhaar Front & Back; + Business Registration for Business)
     * 3. Vendor Availability (Current closures check: 0)
     * 4. Geo-Location Radius (Haversine formula within radiusKm)
     * 5. Category Compliance (Verified document in vendordocuments)
     * 6. Package Items (Only items.isActive === true)
     */
    async getBrowsePackages(params = {}) {
        let query = '', category = '', minPrice = 0, maxPrice = null, sort = '', lat = null, lng = null, radius = 50, address = '', userId = null;

        if (typeof params === 'object' && params !== null) {
            ({
                query = '',
                category = '',
                minPrice = 0,
                maxPrice = null,
                sort = '',
                lat = null,
                lng = null,
                radius = 50,
                address = '',
                userId = null
            } = params);
        } else {
            query = arguments[0] || '';
            category = arguments[1] || '';
            minPrice = arguments[2] || 0;
            maxPrice = arguments[3] ?? null;
            sort = arguments[4] || '';
            lat = arguments[5] || null;
            lng = arguments[6] || null;
            radius = arguments[7] || 50;
            address = arguments[8] || '';
            userId = arguments[9] || null;
        }

        const t0 = performance.now();
        const cacheKey = getBrowseCacheKey({ query, category, minPrice, maxPrice, sort, lat, lng, radius, address, userId });
        const cached = browseCache.get(cacheKey);
        if (cached && (Date.now() - cached.time < BROWSE_CACHE_TTL_MS)) {
            const tEnd = performance.now();
            return cached.data;
        }

        // =========================================================================
        // STEP 1: Fast Parallel Pre-fetching & Vendor-First Verification
        // =========================================================================

        const now = new Date();
        const docFilter = { status: VERIFICATION_STATUS.VERIFIED };
        if (category && typeof category === 'string' && category.trim()) {
            const catSlug = category.trim().toLowerCase();
            const schemaKey = (CATEGORY_MAP[catSlug] || catSlug).toLowerCase();
            docFilter.category_slug = { $in: [catSlug, schemaKey] };
        }

        // 1.1 Parallel execution of independent queries (Drastically cuts initial latency)
        const [compliantDocs, activeClosures, categories] = await Promise.all([
            VendorDocument.find(docFilter).select('vendor category_slug').lean(),
            VendorClosure.find({
                isActive: true,
                startDate: { $lte: now },
                endDate: { $gte: now }
            }).select('vendor').lean(),
            getCachedCategories()
        ]);

        const buildEmptyResult = () => {
            const empty = {};
            browseCache.set(cacheKey, { data: empty, time: Date.now() });
            return empty;
        };

        if (!compliantDocs || compliantDocs.length === 0) return buildEmptyResult();

        const vendorCategoryMap = new Map();
        compliantDocs.forEach(doc => {
            const vId = doc.vendor?.toString();
            if (vId) {
                let set = vendorCategoryMap.get(vId);
                if (!set) {
                    set = new Set();
                    vendorCategoryMap.set(vId, set);
                }
                set.add(doc.category_slug.toLowerCase());
            }
        });

        // 1.2 Vendor Availability Check: Filter out active vacation/closure vendors
        const closedVendorIdSet = new Set(activeClosures.map(c => c.vendor?.toString()).filter(Boolean));

        const eligibleVendorIdStrings = [];
        for (const id of vendorCategoryMap.keys()) {
            if (!closedVendorIdSet.has(id)) eligibleVendorIdStrings.push(id);
        }

        if (eligibleVendorIdStrings.length === 0) return buildEmptyResult();
        const eligibleVendorObjectIds = eligibleVendorIdStrings.map(id => new mongoose.Types.ObjectId(id));
        const vendorQuery = {
            _id: { $in: eligibleVendorObjectIds },
            status: STATUS.ACTIVE,
            isOperating: true,
            isApproved: true,
            $or: [
                {
                    profileType: VENDOR_PROFILE_TYPES.INDIVIDUAL,
                    'documents.panCard.status': VERIFICATION_STATUS.VERIFIED,
                    'documents.aadharCard.0.status': VERIFICATION_STATUS.VERIFIED,
                    'documents.aadharCard.1.status': VERIFICATION_STATUS.VERIFIED,
                    'documents.aadharCard': { $size: 2 }
                },
                {
                    profileType: VENDOR_PROFILE_TYPES.BUSINESS,
                    'documents.panCard.status': VERIFICATION_STATUS.VERIFIED,
                    'documents.aadharCard.0.status': VERIFICATION_STATUS.VERIFIED,
                    'documents.aadharCard.1.status': VERIFICATION_STATUS.VERIFIED,
                    'documents.aadharCard': { $size: 2 },
                    'documents.businessRegistration.status': VERIFICATION_STATUS.VERIFIED
                }
            ]
        };

        // 1.4 Address / Location Query: Priority to vendor/business location, fallback to package location
        if (address && typeof address === 'string' && address.trim()) {
            const addrRegex = new RegExp(address.trim(), 'i');

            // Priority 1: Match directly on vendor address
            const vendorAddressMatchQuery = {
                _id: { $in: eligibleVendorObjectIds },
                $or: [
                    { 'address.city': addrRegex },
                    { 'address.addressLine1': addrRegex },
                    { 'address.addressLine2': addrRegex },
                    { 'address.state': addrRegex }
                ]
            };

            let targetCategoryKeys = Object.values(SCHEMA_KEYS);
            if (category && typeof category === 'string' && category.trim()) {
                const catSlug = category.trim().toLowerCase();
                const targetKey = (CATEGORY_MAP[catSlug] || catSlug).toLowerCase();
                const matchedKey = Object.values(SCHEMA_KEYS).find(k => k.toLowerCase() === targetKey);
                if (matchedKey) targetCategoryKeys = [matchedKey];
            }

            const packageAddressConditions = [];
            for (const key of targetCategoryKeys) {
                packageAddressConditions.push(
                    { [`${key}.location.address`]: addrRegex },
                    { [`${key}.location.city`]: addrRegex }
                );
            }

            // Execute vendor address check and package address check concurrently
            const [directVendorMatches, vendorIdsWithMatchingPackages] = await Promise.all([
                Vendor.find(vendorAddressMatchQuery).distinct('_id'),
                Package.find({
                    vendor: { $in: eligibleVendorObjectIds },
                    $or: packageAddressConditions
                }).distinct('vendor')
            ]);

            const allMatchedVendorIds = Array.from(new Set([
                ...directVendorMatches.map(id => id.toString()),
                ...vendorIdsWithMatchingPackages.map(id => id.toString())
            ])).map(id => new mongoose.Types.ObjectId(id));
            if (allMatchedVendorIds.length === 0) return buildEmptyResult();
            vendorQuery._id = { $in: allMatchedVendorIds };
        }

        // 1.5 Execute Vendor pre-filter query with thin projection (_id and address only)
        const validVendors = await Vendor.find(vendorQuery).select('_id address').lean();
        if (!validVendors || validVendors.length === 0) return buildEmptyResult();

        const validVendorMap = new Map(validVendors.map(v => [v._id.toString(), v]));
        const validVendorObjectIds = validVendors.map(v => v._id);

        // =========================================================================
        // STEP 2: Ultra-Fast Targeted Aggregation Pipeline on Package Collection
        // =========================================================================

        let categoriesToFlatten = Object.values(SCHEMA_KEYS);
        if (category && typeof category === 'string' && category.trim()) {
            const catSlug = category.trim().toLowerCase();
            const targetKey = (CATEGORY_MAP[catSlug] || catSlug).toLowerCase();
            const matchingKey = Object.values(SCHEMA_KEYS).find(k => k.toLowerCase() === targetKey);
            if (matchingKey) {
                categoriesToFlatten = [matchingKey];
            }
        }

        // Filter active items before unwinding to reduce document memory and processing overhead
        const pipeline = [
            {
                $match: {
                    vendor: { $in: validVendorObjectIds }
                }
            },
            {
                $project: {
                    vendor: 1,
                    items: {
                        $concatArrays: categoriesToFlatten.map(key => ({
                            $map: {
                                input: {
                                    $filter: {
                                        input: { $ifNull: [`$${key}`, []] },
                                        as: "subItem",
                                        cond: { $eq: ["$$subItem.isActive", true] }
                                    }
                                },
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
            },
            {
                $unwind: "$items"
            }
        ];

        // Keyword / Text search across title, description, and location
        if (query && typeof query === 'string' && query.trim()) {
            const qRegex = new RegExp(query.trim(), 'i');
            pipeline.push({
                $match: {
                    $or: [
                        { "items.title": qRegex },
                        { "items.description": qRegex },
                        { "items.location.address": qRegex },
                        { "items.location.city": qRegex }
                    ]
                }
            });
        }

        // Price range filter on sellingPrice
        const min = Number(minPrice) || 0;
        const max = (maxPrice !== null && maxPrice !== undefined && !isNaN(Number(maxPrice))) ? Number(maxPrice) : null;
        if (min > 0 || max !== null) {
            const priceFilter = {};
            if (min > 0) priceFilter.$gte = min;
            if (max !== null) priceFilter.$lte = max;
            pipeline.push({
                $match: {
                    "items.pricing.sellingPrice": priceFilter
                }
            });
        }

        // Category filter (if specific category provided)
        if (category && typeof category === 'string' && category.trim()) {
            const catSlug = category.trim().toLowerCase();
            const schemaKey = (CATEGORY_MAP[catSlug] || catSlug).toLowerCase();
            pipeline.push({
                $match: {
                    "items.category": { $in: [catSlug, schemaKey] }
                }
            });
        }

        // Price Sorting
        if (sort === 'price_asc' || sort === 'price_desc') {
            const sortDir = sort === 'price_asc' ? 1 : -1;
            pipeline.push(
                {
                    $addFields: {
                        sortPrice: { $ifNull: ["$items.pricing.sellingPrice", sort === 'price_asc' ? 99999999 : 0] }
                    }
                },
                {
                    $sort: { sortPrice: sortDir }
                }
            );
        }

        // Fast Reviews Lookup: Database-level average & count using index { 'item.itemId': 1, isVisible: 1 }
        pipeline.push({
            $lookup: {
                from: 'reviews',
                let: { itemId: "$items._id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$item.itemId", "$$itemId"] },
                                    { $eq: ["$isVisible", true] }
                                ]
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            average: { $avg: "$rating" },
                            count: { $sum: 1 }
                        }
                    }
                ],
                as: 'ratingStats'
            }
        });

        // Wishlist Lookup: ONLY if userId is provided
        const hasUserId = Boolean(userId && mongoose.Types.ObjectId.isValid(userId));
        if (hasUserId) {
            pipeline.push({
                $lookup: {
                    from: 'wishlists',
                    let: { itemId: "$items._id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$user", new mongoose.Types.ObjectId(userId)] },
                                        { $eq: ["$itemId", "$$itemId"] }
                                    ]
                                }
                            }
                        },
                        {
                            $project: { _id: 1 }
                        },
                        { $limit: 1 }
                    ],
                    as: 'userWishlist'
                }
            });
        }

        // Standalone Projection
        pipeline.push({
            $project: {
                _id: "$items._id",
                vendor: "$vendor",
                title: "$items.title",
                isActive: "$items.isActive",
                pricing: "$items.pricing",
                location: "$items.location",
                photos: "$items.photos",
                category: "$items.category",
                reviews: {
                    average: {
                        $cond: [
                            { $gt: [{ $size: "$ratingStats" }, 0] },
                            { $round: [{ $arrayElemAt: ["$ratingStats.average", 0] }, 1] },
                            0
                        ]
                    },
                    count: {
                        $cond: [
                            { $gt: [{ $size: "$ratingStats" }, 0] },
                            { $arrayElemAt: ["$ratingStats.count", 0] },
                            0
                        ]
                    }
                },
                wishlist: hasUserId
                    ? { $gt: [{ $size: { $ifNull: ["$userWishlist", []] } }, 0] }
                    : { $literal: false }
            }
        });

        const items = await Package.aggregate(pipeline);
        const { latitude, longitude, hasCoords } = normalizeCoordinates(lat, lng);
        const radiusKm = parseFloat(radius) || 50;
        const itemsByCategory = new Map();
        for (const item of items) {
            const vId = item.vendor?.toString();
            const itemCatKey = (item.category || '').toLowerCase();
            const catSlug = Object.keys(CATEGORY_MAP).find(s => CATEGORY_MAP[s].toLowerCase() === itemCatKey) || itemCatKey;
            const allowedCategories = vendorCategoryMap.get(vId);
            if (!allowedCategories || (!allowedCategories.has(catSlug) && !allowedCategories.has(itemCatKey))) continue;
            const vendor = validVendorMap.get(vId);
            const vendorCoords = vendor?.address?.location?.coordinates;
            const itemCoords = item.location?.coordinates;
            const hasVendorCoords = Array.isArray(vendorCoords) && (vendorCoords[0] !== 0 || vendorCoords[1] !== 0);
            const itemLng = hasVendorCoords ? vendorCoords[0] : itemCoords?.[0];
            const itemLat = hasVendorCoords ? vendorCoords[1] : itemCoords?.[1];

            if (hasCoords) {
                if (itemLat !== undefined && itemLng !== undefined && (itemLat !== 0 || itemLng !== 0)) {
                    const dist = calculateDistanceKm(latitude, longitude, itemLat, itemLng);
                    item.distance = dist;
                    if (dist !== null && dist > radiusKm) continue;
                } else {
                    item.distance = null;
                }
            } else {
                item.distance = null;
            }

            let group = itemsByCategory.get(itemCatKey);
            if (!group) {
                group = [];
                itemsByCategory.set(itemCatKey, group);
            }
            group.push(item);
        }

        // 3.3 Group by category and enrich pricing with taxes
        const result = {};

        for (const cat of categories) {
            const slug = (cat.slug || '').toLowerCase();
            const schemaKey = (CATEGORY_MAP[slug] || slug).toLowerCase();

            if (category) {
                const target = category.trim().toLowerCase();
                const targetKey = (CATEGORY_MAP[target] || target).toLowerCase();
                const isMatch = (slug === target || schemaKey === target || slug === targetKey || schemaKey === targetKey);
                if (!isMatch) continue;
            }

            const matchedItems = (itemsByCategory.get(schemaKey) || []).concat(schemaKey !== slug ? (itemsByCategory.get(slug) || []) : []);

            if (matchedItems.length === 0) continue;

            result[slug] = matchedItems.map(item => {
                return {
                    id: item._id,
                    title: item.title,
                    isActive: item.isActive,
                    pricing: {
                        basePrice: item.pricing.basePrice || 0,
                        gst: item.pricing.gst || 18,
                        sellingPrice: item.pricing.sellingPrice || 0,
                    },
                    address: item?.location?.address || '',
                    location: getLocationPoint(item?.location),
                    photos: item.photos[0]?.url || "",
                    category_name: cat.name || "",
                    category_id: cat._id || "",
                    rating: {
                        average: item.reviews?.average || 0,
                        count: item.reviews?.count || 0
                    },
                    wishlist: Boolean(item.wishlist)
                };
            });
        }

        browseCache.set(cacheKey, { data: result, time: Date.now() });
        if (browseCache.size > 200) {
            const expireBefore = Date.now() - BROWSE_CACHE_TTL_MS;
            for (const [k, v] of browseCache.entries()) {
                if (v.time < expireBefore) browseCache.delete(k);
            }
        }

        const tEnd = performance.now();
        return result;
    }

    async getAvailablePackagesByCategory({ query = '', category = '', minPrice = 0, maxPrice = null, sort = '', lat = null, lng = null, radius = 50, address = '' } = {}) {
        const flattened = await this.getAvailablePackages(query, minPrice, maxPrice, sort);
        const categories = await Category.find({}).lean();
        const result = {};

        const taxes = await getTaxConfig();

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
                pricing: applyTaxesToPricing(item.pricing, taxes),
                pricePerNight: item.pricePerNight,
                pricePerPerson: item.pricePerPerson,
                pricePerDay: item.pricePerDay,
                location: item.location || {},
                photos: item.photos?.[0] || "",
                category_name: cat.name || "",
                category_slug: slug,
                category_id: cat._id || "",
                reviews: item.reviews || []
            }));
        });
        return result;
    }

    async searchPackages(lat, lng, categorySlug = '', radiusKm = 50) {
        const { latitude, longitude, hasCoords } = normalizeCoordinates(lat, lng);
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

            // 4. Flatten Packages
            pipeline.push(...getFlattenPackageItemsStages({
                catalogPrefix: 'catalog',
                extraProjectFields: { vendorProfile: 1 }
            }));

            // 5. Verification & Filtering
            pipeline.push(...this.masterService.getCategoryVerificationStages('items', 'vendorProfile._id'));

            const finalMatch = { "items.isActive": true };
            if (targetSchemaKey) {
                finalMatch["items.category"] = { $regex: new RegExp(`^${targetSchemaKey}$`, 'i') };
            }
            pipeline.push({ $match: finalMatch });

            // 6. Lookup Reviews
            pipeline.push(getReviewsLookupStage("$items._id"));

            // 7. Final Projection
            pipeline.push(getPackageItemProjectionStage({
                distance: "$vendorProfile.distance"
            }));

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
