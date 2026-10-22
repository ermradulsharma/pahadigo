/**
 * @file browsePackages.js
 * @module core/Helpers/browsePackages
 * @description High-performance public browsing, filtering, and discovery engine for PahadiGo packages.
 *
 * Fulfills all core business and compliance rules:
 * 1. Vendor Basic Status  : active: true, isOperating: true, isApproved: true, deletedAt: null
 * 2. Vendor KYC           : PAN verified, Aadhaar front & back verified, Business Reg verified (for businesses)
 * 3. Vendor Closures      : Automatically excludes vendors on active vacation/closure (startDate <= now <= endDate)
 * 4. Category Compliance  : Verified category document required; STRICTLY BLOCKS any category with EXPIRED documents (expiry_date < now)
 * 5. Geo-Location Radius  : Haversine distance filtering with item-level coordinates and vendor business location fallback
 * 6. Dual Address Search  : Matches city/address on vendor business location with fallback to package locations
 * 7. Active Items Only    : Filters package subdocuments by isActive: true
 * 8. Reviews & Ratings    : Database-level average rating and review counts ({ average, count })
 * 9. User Wishlist Status : Dynamically flags items saved by the logged-in traveller
 * 10. Dual Output Formats : Supports categorized dictionary ({ [categorySlug]: { items, pagination } }) or flat array ({ items, pagination })
 * 11. Multi-Tier Caching  : Static Category caching (5 mins) + Dynamic Browse Query LRU caching (2 mins)
 */

import mongoose from 'mongoose';
import Package from '@/core/Models/Package.js';
import Vendor from '@/core/Models/Vendor.js';
import VendorClosure from '@/core/Models/VendorClosure.js';
import VendorDocument from '@/core/Models/VendorDocument.js';
import Category from '@/core/Models/Category.js';
import MasterService from '@/core/Services/MasterService.js';
import { getManyBy, getCategoriesBy, getVendorDocumentsBy } from '@/core/Helpers/queryHelpers.js';
import { CATEGORY_MAP, SCHEMA_KEYS } from '@/core/Constants/categories.js';
import { STATUS, VERIFICATION_STATUS, VENDOR_PROFILE_TYPES } from '@/core/Constants/index.js';
import { getLocationPoint } from '@/core/Helpers/addressHelper.js';
import { normalizeCoordinates, calculateDistanceKm } from '@/core/Services/Shared/PackageCore.js';

// =============================================================================
// CACHING ARCHITECTURE
// =============================================================================

/**
 * In-memory 5-minute cache for static Category master data to avoid redundant DB reads.
 * @type {Array<Object>|null}
 */
let cachedCategories = null;
let lastCategoryFetchTime = 0;
const CATEGORY_CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Retrieves category master records from memory cache or fetches from MongoDB via queryHelpers.
 * @returns {Promise<Array<Object>>} Array of lean Category documents
 */
async function getCachedCategories() {
    const now = Date.now();
    if (cachedCategories && (now - lastCategoryFetchTime < CATEGORY_CACHE_TTL_MS)) {
        return cachedCategories;
    }
    cachedCategories = await getCategoriesBy({});
    lastCategoryFetchTime = now;
    return cachedCategories;
}

/**
 * In-memory 120-second (2 minutes) LRU cache for computed browse query results.
 * @type {Map<string, { data: Object, time: number }>}
 */
const browseCache = new Map();
const BROWSE_CACHE_TTL_MS = 120 * 1000;

/**
 * Constructs a unique, deterministic cache key from all normalized input parameters.
 * @param {Object} params - Normalized request parameters
 * @returns {string} Colon-delimited cache key
 */
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
        params.userId || '',
        Boolean(params.isFlat === true || params.isFlat === 'true'),
        params.page || 1,
        params.limit !== undefined ? params.limit : 100
    ].join('::');
}

// =============================================================================
// MAIN BROWSING & DISCOVERY HANDLER
// =============================================================================

/**
 * Executes full package discovery, compliance filtering, geo-radius matching, and pagination.
 *
 * @async
 * @param {Object} [params={}] - Filter and pagination criteria
 * @param {string} [params.query=''] - Search term for title, description, city, or address
 * @param {string} [params.category=''] - Category slug (e.g. 'homestay', 'trekking')
 * @param {number} [params.minPrice=0] - Minimum selling price filter
 * @param {number|null} [params.maxPrice=null] - Maximum selling price filter
 * @param {string} [params.sort=''] - Sorting option ('price_asc' | 'price_desc' | default)
 * @param {number|null} [params.lat=null] - User latitude for geo-distance calculation
 * @param {number|null} [params.lng=null] - User longitude for geo-distance calculation
 * @param {number} [params.radius=50] - Geo-radius cutoff in kilometers
 * @param {string} [params.address=''] - Location keyword to match against vendor/package addresses
 * @param {string|null} [params.userId=null] - Logged-in traveller's ObjectId string for wishlist status
 * @param {boolean|string} [params.isFlat=false] - True for flat array, false for category-grouped dictionary
 * @param {number|string} [params.page=1] - 1-indexed page number
 * @param {number|string} [params.limit=100] - Number of items per page (0 returns all)
 *
 * @returns {Promise<Object>} Formatted result object with items, ratings, wishlist flags, and pagination
 */
export async function getBrowsePackages(params = {}) {
    const {
        query = '',
        category = '',
        minPrice = 0,
        maxPrice = null,
        sort = '',
        lat = null,
        lng = null,
        radius = 50,
        address = '',
        userId = null,
        isFlat = false,
        page = 1,
        limit = 100
    } = typeof params === 'object' && params !== null ? params : {};

    // Parameter Normalization
    const isFlatBool = isFlat === true || isFlat === 'true';
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(0, parseInt(limit, 10) || 0);

    // Category Normalization (resolves schema keys such as 'homestay', 'trekking', 'vehicleRental')
    const filterCatSlug = (typeof category === 'string' && category.trim()) ? category.trim().toLowerCase() : '';
    const filterCatSchemaKey = filterCatSlug ? (CATEGORY_MAP[filterCatSlug] || filterCatSlug).toLowerCase() : '';
    const matchedCategoryKey = filterCatSchemaKey ? Object.values(SCHEMA_KEYS).find(k => k.toLowerCase() === filterCatSchemaKey) : null;
    const categoriesToFlatten = matchedCategoryKey ? [matchedCategoryKey] : Object.values(SCHEMA_KEYS);

    // Check LRU Cache
    const cacheKey = getBrowseCacheKey({
        query,
        category: filterCatSlug,
        minPrice,
        maxPrice,
        sort,
        lat,
        lng,
        radius,
        address,
        userId,
        isFlat: isFlatBool,
        page: pageNum,
        limit: limitNum
    });

    const cached = browseCache.get(cacheKey);
    if (cached && (Date.now() - cached.time < BROWSE_CACHE_TTL_MS)) return cached.data;

    /**
     * Internal helper to sort and paginate an array of package items.
     * @param {Array<Object>} itemsList - Raw package items
     * @returns {{ items: Array<Object>, pagination: Object }} Paginated payload
     */
    const paginateAndSort = (itemsList = []) => {
        if (sort === 'price_asc') {
            itemsList.sort((a, b) => (a.pricing?.sellingPrice || 0) - (b.pricing?.sellingPrice || 0));
        } else if (sort === 'price_desc') {
            itemsList.sort((a, b) => (b.pricing?.sellingPrice || 0) - (a.pricing?.sellingPrice || 0));
        } else {
            itemsList.sort((a, b) => (b.id || '').toString().localeCompare((a.id || '').toString()));
        }

        const total = itemsList.length;
        const skip = (pageNum - 1) * (limitNum || total);
        const paginatedItems = limitNum > 0 ? itemsList.slice(skip, skip + limitNum) : itemsList;
        const totalPages = limitNum > 0 ? (Math.ceil(total / limitNum) || 0) : 1;

        return {
            items: paginatedItems,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum === 0 ? total : limitNum,
                totalPages
            }
        };
    };

    /**
     * Builds and caches an empty response payload when filters produce zero matches.
     * @returns {Object} Empty categorized dictionary or empty flat array with pagination
     */
    const buildEmptyResult = () => {
        const emptyResult = isFlatBool ? paginateAndSort([]) : {};
        browseCache.set(cacheKey, { data: emptyResult, time: Date.now() });
        return emptyResult;
    };

    // =========================================================================
    // STEP 1: Parallel Pre-fetching & Strict Vendor-Level Compliance
    // =========================================================================

    const now = new Date();
    const docQuery = {};
    if (filterCatSlug) docQuery.category_slug = { $in: [filterCatSlug, filterCatSchemaKey] };

    // 1.1 Concurrently fetch category documents, active vendor vacation closures, and categories
    const [allDocs, activeClosures, categories] = await Promise.all([
        getVendorDocumentsBy(docQuery, 'vendor category_slug status url expiry_date'),
        getManyBy(VendorClosure, {
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now }
        }, 'vendor'),
        getCachedCategories()
    ]);

    if (!allDocs || allDocs.length === 0) return buildEmptyResult();

    // 1.2 Evaluate Category Verification & Strict Document Expiry
    // A vendor is permitted for a category IF AND ONLY IF:
    // (a) They have at least 1 verified document with valid URL.
    // (b) NONE of their documents for that category have expired (expiry_date < now).
    const vendorCategoryMap = new Map();
    const expiredVendorCategories = new Set();

    allDocs.forEach(doc => {
        const vId = doc.vendor?.toString();
        const catSlug = doc.category_slug ? doc.category_slug.toLowerCase() : '';
        if (!vId || !catSlug) return;

        const vendorCatKey = `${vId}::${catSlug}`;

        // STRICT EXPIRY CHECK: If expiry_date has passed, mark this category as EXPIRED!
        if (doc.expiry_date && new Date(doc.expiry_date) < now) {
            expiredVendorCategories.add(vendorCatKey);
            return;
        }

        // Active verified document check
        if (doc.status === VERIFICATION_STATUS.VERIFIED && doc.url) {
            let set = vendorCategoryMap.get(vId);
            if (!set) {
                set = new Set();
                vendorCategoryMap.set(vId, set);
            }
            set.add(catSlug);
        }
    });

    // Strictly purge any category if ANY document for that category is expired
    for (const vendorCatKey of expiredVendorCategories) {
        const [vId, catSlug] = vendorCatKey.split('::');
        const set = vendorCategoryMap.get(vId);
        if (set) {
            set.delete(catSlug);
            if (set.size === 0) vendorCategoryMap.delete(vId);
        }
    }

    if (vendorCategoryMap.size === 0) return buildEmptyResult();

    // 1.3 Vendor Operational Availability Check: Filter out vendors currently on vacation/closure
    const closedVendorIdSet = new Set(activeClosures.map(c => c.vendor?.toString()).filter(Boolean));

    const eligibleVendorIdStrings = [];
    for (const id of vendorCategoryMap.keys()) {
        if (!closedVendorIdSet.has(id)) eligibleVendorIdStrings.push(id);
    }

    if (eligibleVendorIdStrings.length === 0) return buildEmptyResult();
    const eligibleVendorObjectIds = eligibleVendorIdStrings.map(id => new mongoose.Types.ObjectId(id));

    // 1.4 Vendor KYC & MasterService Verification Criteria (PAN, Aadhaar Front+Back, Business Reg)
    const vendorQuery = {
        _id: { $in: eligibleVendorObjectIds },
        ...MasterService.getVendorActiveMatchCriteria()
    };

    // 1.5 Address / Location Pre-Filter: Dual match on vendor business address and package location
    if (address && typeof address === 'string' && address.trim()) {
        const addrRegex = new RegExp(address.trim(), 'i');

        // Priority 1: Match directly on vendor registered business address
        const vendorAddressMatchQuery = {
            _id: { $in: eligibleVendorObjectIds },
            $or: [
                { 'address.city': addrRegex },
                { 'address.addressLine1': addrRegex },
                { 'address.addressLine2': addrRegex },
                { 'address.state': addrRegex }
            ]
        };

        // Priority 2: Match on individual package item location fields
        const packageAddressConditions = [];
        for (const key of categoriesToFlatten) {
            packageAddressConditions.push(
                { [`${key}.location.address`]: addrRegex },
                { [`${key}.location.city`]: addrRegex }
            );
        }

        // Execute vendor address and package address checks concurrently via queryHelpers
        const [directVendorDocs, packageDocsWithMatchingAddress] = await Promise.all([
            getManyBy(Vendor, vendorAddressMatchQuery, '_id'),
            getManyBy(Package, {
                vendor: { $in: eligibleVendorObjectIds },
                $or: packageAddressConditions
            }, 'vendor')
        ]);

        const allMatchedVendorIds = Array.from(new Set([
            ...directVendorDocs.map(v => v._id?.toString()),
            ...packageDocsWithMatchingAddress.map(p => p.vendor?.toString())
        ])).filter(Boolean).map(id => new mongoose.Types.ObjectId(id));

        if (allMatchedVendorIds.length === 0) return buildEmptyResult();
        vendorQuery._id = { $in: allMatchedVendorIds };
    }

    // 1.6 Fetch compliant vendors with thin projection (_id and address coordinates only)
    const validVendors = await getManyBy(Vendor, vendorQuery, '_id address');
    if (!validVendors || validVendors.length === 0) return buildEmptyResult();

    const validVendorMap = new Map(validVendors.map(v => [v._id.toString(), v]));
    const validVendorObjectIds = validVendors.map(v => v._id);

    // =========================================================================
    // STEP 2: Targeted MongoDB Aggregation Pipeline on Package Collection
    // =========================================================================

    // 2.1 Pre-filter active sub-items before unwinding to reduce memory and processing overhead
    const pipeline = [
        { $match: { vendor: { $in: validVendorObjectIds } } },
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
                            in: { $mergeObjects: ["$$item", { category: key, catalogId: "$_id" }] }
                        }
                    }))
                }
            }
        },
        {
            $unwind: "$items"
        }
    ];

    // 2.2 Text / Keyword Search (across item title, description, address, city)
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

    // 2.3 Selling Price Range Filter
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

    // 2.4 Targeted Category Filter
    if (filterCatSlug) {
        pipeline.push({
            $match: {
                "items.category": { $in: [filterCatSlug, filterCatSchemaKey] }
            }
        });
    }

    // 2.5 Price Sorting
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

    // 2.6 Fast Reviews Lookup: Database-level average rating & count calculation
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

    // 2.7 User Wishlist Resolution: Only executed when userId is provided
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

    // 2.8 Standalone Projection Stage
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
            wishlist: hasUserId ? { $gt: [{ $size: { $ifNull: ["$userWishlist", []] } }, 0] } : { $literal: false }
        }
    });

    // =========================================================================
    // STEP 3: Post-Aggregation In-Memory Processing & Distance Filtering
    // =========================================================================

    const items = await Package.aggregate(pipeline);
    const { latitude, longitude, hasCoords } = normalizeCoordinates(lat, lng);
    const radiusKm = parseFloat(radius) || 50;
    const itemsByCategory = new Map();

    for (const item of items) {
        const vId = item.vendor?.toString();
        const itemCatKey = (item.category || '').toLowerCase();
        const catSlug = Object.keys(CATEGORY_MAP).find(s => CATEGORY_MAP[s].toLowerCase() === itemCatKey) || itemCatKey;

        // Verify that this vendor's category is still valid and not expired
        const allowedCategories = vendorCategoryMap.get(vId);
        if (!allowedCategories || (!allowedCategories.has(catSlug) && !allowedCategories.has(itemCatKey))) continue;

        // Coordinate Fallback: Package item coordinates -> Vendor business address coordinates
        const vendor = validVendorMap.get(vId);
        const vendorCoords = vendor?.address?.location?.coordinates;
        const itemCoords = item.location?.coordinates;
        const hasVendorCoords = Array.isArray(vendorCoords) && (vendorCoords[0] !== 0 || vendorCoords[1] !== 0);
        const itemLng = hasVendorCoords ? vendorCoords[0] : itemCoords?.[0];
        const itemLat = hasVendorCoords ? vendorCoords[1] : itemCoords?.[1];

        // 3.1 Haversine Distance Calculation & Radius Enforcement
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

        // Group into category bucket
        let group = itemsByCategory.get(itemCatKey);
        if (!group) {
            group = [];
            itemsByCategory.set(itemCatKey, group);
        }
        group.push(item);
    }

    // 3.2 Structure and Normalize Items with Final Schema
    const result = {};

    for (const cat of categories) {
        const slug = (cat.slug || '').toLowerCase();
        const schemaKey = (CATEGORY_MAP[slug] || slug).toLowerCase();

        // Skip non-requested categories if filter was explicitly provided
        if (filterCatSlug && slug !== filterCatSlug && schemaKey !== filterCatSlug && slug !== filterCatSchemaKey && schemaKey !== filterCatSchemaKey) {
            continue;
        }

        const matchedItems = (itemsByCategory.get(schemaKey) || []).concat(schemaKey !== slug ? (itemsByCategory.get(slug) || []) : []);
        if (matchedItems.length === 0) continue;

        result[slug] = matchedItems.map(item => ({
            id: item._id,
            title: item.title,
            isActive: item.isActive,
            pricing: {
                basePrice: item.pricing?.basePrice || 0,
                gst: item.pricing?.gst || 18,
                sellingPrice: item.pricing?.sellingPrice || 0,
            },
            address: item?.location?.address || '',
            location: getLocationPoint(item?.location),
            photos: typeof item.photos?.[0] === 'string' ? item.photos[0] : (item.photos?.[0]?.url || ""),
            category_name: cat.name || "",
            category_id: cat._id || "",
            rating: {
                average: item.reviews?.average || 0,
                count: item.reviews?.count || 0
            },
            wishlist: Boolean(item.wishlist)
        }));
    }

    // 3.3 Output Formatting (isFlat boolean support) & Pagination
    let finalResult;

    if (isFlatBool) {
        const allItems = Object.values(result).flat();
        finalResult = paginateAndSort(allItems);
    } else {
        finalResult = {};
        for (const slug in result) {
            finalResult[slug] = paginateAndSort(result[slug]);
        }
    }

    // 3.4 Bounded Cache Eviction & Storage
    browseCache.set(cacheKey, { data: finalResult, time: Date.now() });
    if (browseCache.size > 200) {
        const expireBefore = Date.now() - BROWSE_CACHE_TTL_MS;
        for (const [k, v] of browseCache.entries()) {
            if (v.time < expireBefore) browseCache.delete(k);
        }
        while (browseCache.size > 200) {
            const oldestKey = browseCache.keys().next().value;
            browseCache.delete(oldestKey);
        }
    }

    return finalResult;
}

export default getBrowsePackages;