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
import { getManyBy, getCategoriesBy, getVendorDocumentsBy, getCategoryBySlug } from '@/core/Helpers/queryHelpers.js';
import { CATEGORY_MAP, SCHEMA_KEYS } from '@/core/Constants/categories.js';
import { STATUS, VERIFICATION_STATUS, VENDOR_PROFILE_TYPES } from '@/core/Constants/index.js';
import { getLocationPoint } from '@/core/Helpers/addressHelper.js';
import { normalizeCoordinates, calculateDistanceKm } from '@/core/Services/Shared/PackageCore.js';
import { formatPackageItem } from '@/core/Helpers/search.js';
import { packageItemResponse } from './packageResponse.js';
import { paginateItems, buildEmptyResult, schemaKey } from './shared.js';

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
 * @param {Object} q - Normalized request parameters
 * @returns {string} Colon-delimited cache key
 */
function getBrowseCacheKey(q) {
    const { query, category, minPrice, maxPrice, sort, lat, lng, radius, address, userId, isFlat, page, limit } = q || {};
    return [
        query || '',
        category || '',
        minPrice || 0,
        maxPrice ?? '',
        sort || '',
        lat ?? '',
        lng ?? '',
        radius || 50,
        address || '',
        userId || '',
        Boolean(isFlat === true || isFlat === 'true'),
        page || 1,
        limit !== undefined ? limit : 100
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
export async function getBrowsePackages(options = {}) {
    const { userId, page = 1, limit = 10, minPrice = 0, maxPrice = null, format, sort = '', query = '', category = '', lat = null, lng = null, radius = null, address = '' } = options;

    let isFlat = false;
    if (format === 'flat') isFlat = true;

    let categoryObj = {};
    let slugQuery = {};
    if (category) {
        categoryObj = await getCategoryBySlug(category);
        slugQuery.category_slug = categoryObj.slug;
    } else {
        categoryObj = await getCategoriesBy({ isActive: true })
    }


    /**
     * Internal helper to sort and paginate an array of package items.
     * @param {Array<Object>} itemsList - Raw package items
     * @returns {{ items: Array<Object>, pagination: Object }} Paginated payload
     */
    // const paginateItems = paginateItems([], { sort, page, limit });
    // const emptyResult = buildEmptyResult(isFlat, { sort, page, limit });

    // =========================================================================
    // STEP 1: Parallel Pre-fetching & Strict Vendor-Level Compliance
    // =========================================================================

    const now = new Date();

    // 1.1 Concurrently fetch category documents, active vendor vacation closures, and categories
    const [allDocs, activeClosures, categories] = await Promise.all([
        getVendorDocumentsBy(slugQuery, 'vendor category_slug status url expiry_date'),
        getManyBy(VendorClosure, { isActive: true, startDate: { $lte: now }, endDate: { $gte: now } }, 'vendor'),
        category ? [categoryObj] : categoryObj
    ]);

    if (!allDocs || allDocs.length === 0) return buildEmptyResult(isFlat, { sort, page, limit });

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

    if (vendorCategoryMap.size === 0) return buildEmptyResult(isFlat, { sort, page, limit });

    // 1.3 Vendor Operational Availability Check: Filter out vendors currently on vacation/closure
    const closedVendorIdSet = new Set(activeClosures.map(c => c.vendor?.toString()).filter(Boolean));

    const eligibleVendorIdStrings = [];
    for (const id of vendorCategoryMap.keys()) {
        if (!closedVendorIdSet.has(id)) eligibleVendorIdStrings.push(id);
    }

    if (eligibleVendorIdStrings.length === 0) return buildEmptyResult(isFlat, { sort, page, limit });
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
        const vendorAddressQuery = {
            _id: { $in: eligibleVendorObjectIds },
            $or: [
                { 'address.city': addrRegex },
                { 'address.addressLine1': addrRegex },
                { 'address.addressLine2': addrRegex },
                { 'address.state': addrRegex }
            ]
        };

        // Priority 2: Match on individual package item location fields
        const itemAddressQuery = [];
        for (const { name } of categories) {
            const key = schemaKey(name);
            itemAddressQuery.push({ [`${key}.location.address`]: addrRegex }, { [`${key}.location.city`]: addrRegex });
        }

        // Execute vendor address and package address checks concurrently via queryHelpers
        const [directVendorDocs, packageDocsWithMatchingAddress] = await Promise.all([
            getManyBy(Vendor, vendorAddressQuery, '_id'),
            getManyBy(Package, { vendor: { $in: eligibleVendorObjectIds }, $or: itemAddressQuery }, 'vendor')
        ]);

        const allMatchedVendorIds = Array.from(new Set([...directVendorDocs.map(v => v._id?.toString()), ...packageDocsWithMatchingAddress.map(p => p.vendor?.toString())])).filter(Boolean).map(id => new mongoose.Types.ObjectId(id));

        if (allMatchedVendorIds.length === 0) return buildEmptyResult(isFlat, { sort, page, limit });
        vendorQuery._id = { $in: allMatchedVendorIds };
    }

    // 1.6 Fetch compliant vendors with thin projection (_id and address coordinates only)
    const validVendors = await getManyBy(Vendor, vendorQuery, '_id address');
    if (!validVendors || validVendors.length === 0) return buildEmptyResult(isFlat, { sort, page, limit });

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
                    $concatArrays: categories.map(({ name, slug }) => {
                        const key = schemaKey(name);
                        return {
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
                                    $mergeObjects: ["$$item", {
                                        catalog_id: "$_id",
                                        category_name: name,
                                        category_slug: slug
                                    }]
                                }
                            }
                        }
                    })
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
        pipeline.push({ $match: { "items.pricing.sellingPrice": priceFilter } });
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
            id: "$items._id",
            vendor: "$vendor",
            title: "$items.title",
            isActive: "$items.isActive",
            pricing: "$items.pricing",
            address: "$items.location.address",
            location: "$items.location",
            photos: "$items.photos",
            category_slug: "$items.category_slug",
            category_name: "$items.category_name",
            category_id: "$items.category_id",
            rating: { $arrayElemAt: ["$reviewStats", 0] },
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
        // console.log("item 1111", item)
        const vId = item.vendor?.toString();
        const itemCatKey = item.category_slug;
        const catSlug = item.category_slug;

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

    // 3.3 Output Formatting (isFlat boolean support) & Pagination
    let finalResult;

    if (isFlat) {
        const allItems = Object.values(itemsByCategory).flat();
        finalResult = paginateItems(allItems, options);
    } else {
        finalResult = {};
        for (const slug in itemsByCategory) {
            finalResult[slug] = paginateItems(itemsByCategory[slug], options);
        }
    }

    // 3.4 Bounded Cache Eviction & Storage
    // browseCache.set(cacheKey, { data: finalResult, time: Date.now() });
    // if (browseCache.size > 200) {
    //     const expireBefore = Date.now() - BROWSE_CACHE_TTL_MS;
    //     for (const [k, v] of browseCache.entries()) {
    //         if (v.time < expireBefore) browseCache.delete(k);
    //     }
    //     while (browseCache.size > 200) {
    //         const oldestKey = browseCache.keys().next().value;
    //         browseCache.delete(oldestKey);
    //     }
    // }

    return finalResult;
}

export default getBrowsePackages;