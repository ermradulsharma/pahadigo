/**
 * @file browsePackages.js
 * @module core/Helpers/Package/browsePackages
 * @description Hybrid High-Performance discovery and compliance engine for PahadiGo packages.
 *
 * Performance Architecture (Tarika 1 - High Performance Pre-filter):
 * 1. Parallel Pre-filter (Node.js level):
 *    - Resolves vendor vacations/closures concurrently.
 *    - Strict Category Compliance:
 *      * Kam se kam 1 verified document hona chahiye.
 *      * STRICT RULE: Agar vendor ki us category ka EK BHI document UNVERIFIED (pending/rejected) ya EXPIRED hai, toh us vendor ki wo category block ho jayegi.
 * 2. KYC & Status Verification:
 *    - Queries Vendor collection with MasterService.getVendorActiveMatchCriteria() strictly on eligible IDs.
 * 3. Dual Address Search:
 *    - Matches address keyword on vendor business address or package item address.
 * 4. Ultra-Fast Indexed Aggregation (MongoDB level):
 *    - Direct { $match: { vendor: { $in: finalVendorIds } } } — zero heavy $lookups for closures/documents inside DB!
 *    - Active package items only (isActive: true).
 *    - Search query, price filters & sorting.
 *    - Fast Reviews & Wishlist resolution.
 * 5. In-Memory Post Processing:
 *    - Haversine distance & geo-radius enforcement with coordinates fallback.
 *    - Dual output format (flat array or category-grouped dictionary).
 * 6. LRU Query Caching (120 seconds).
 */

import mongoose from 'mongoose';
import Package from '@/core/Models/Package.js';
import Vendor from '@/core/Models/Vendor.js';
import VendorClosure from '@/core/Models/VendorClosure.js';
import VendorDocument from '@/core/Models/VendorDocument.js';
import MasterService from '@/core/Services/MasterService.js';
import { getManyBy, getCategoriesBy, getCategoryBySlug } from '@/core/Helpers/queryHelpers.js';
import { VERIFICATION_STATUS } from '@/core/Constants/index.js';
import { normalizeCoordinates, calculateDistanceKm } from '@/core/Services/Shared/PackageCore.js';
import { packageItemResponse } from './packageResponse.js';
import { paginateItems, buildEmptyResult, sortItems, schemaKey, itemsReviews, itemsWishlist, itemsProject } from './shared.js';
import { getAppConfig } from '@/core/Lib/appConfig.js';

// =============================================================================
// CACHING ARCHITECTURE
// =============================================================================

const browseCache = new Map();
const BROWSE_CACHE_TTL_MS = 120 * 1000;

function getBrowseCacheKey(q) {
    const { query, category, minPrice, maxPrice, sort, lat, lng, radius, address, userId, format, page, limit } = q || {};
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
        format || 'grouped',
        page || 1,
        limit !== undefined ? limit : 10
    ].join('::');
}

// =============================================================================
// MAIN BROWSING & DISCOVERY HANDLER
// =============================================================================

export async function getTestBrowsePackages(options = {}) {
    const { userId, page = 1, limit = 10, minPrice = 0, maxPrice = null, format, sort = '', query = '', category = '', lat = null, lng = null, radius = null, address = '' } = options;

    const isFlat = format === 'flat';
    const cacheKey = getBrowseCacheKey(options);

    // 0. Micro-cache Check (Sub-millisecond response)
    const cachedData = browseCache.get(cacheKey);
    if (cachedData && (Date.now() - cachedData.time < BROWSE_CACHE_TTL_MS)) return cachedData.data;

    // 1. Resolve Requested Categories
    let categoryObj = null;
    let categories = [];
    if (category) {
        categoryObj = await getCategoryBySlug(category);
        if (!categoryObj) return buildEmptyResult(isFlat, { sort, page, limit });
        categories = [categoryObj];
    } else {
        categories = await getCategoriesBy({ isActive: true });
    }

    if (!categories || categories.length === 0) return buildEmptyResult(isFlat, { sort, page, limit });

    const now = new Date();

    // =========================================================================
    // STEP 1: Fast Parallel Pre-Fetch (Closures & Category Documents)
    // =========================================================================

    const docQuery = {};
    if (category && categoryObj?.slug) docQuery.category_slug = categoryObj.slug;

    const [activeClosures, allCategoryDocs] = await Promise.all([
        getManyBy(VendorClosure, { isActive: true, startDate: { $lte: now }, endDate: { $gte: now } }, 'vendor'),
        getManyBy(VendorDocument, docQuery, 'vendor category_slug status url expiry_date')
    ]);

    if (!allCategoryDocs || allCategoryDocs.length === 0) return buildEmptyResult(isFlat, { sort, page, limit });

    // =========================================================================
    // STEP 2: Strict Category Compliance & Expiry Enforcement
    // =========================================================================
    // Rule:
    // (a) Category must have AT LEAST 1 verified document with non-empty URL.
    // (b) STRICT BLOCK: If ANY document for this category is unverified (pending/rejected) OR expired -> BLOCK CATEGORY!

    const vendorCategoryMap = new Map(); // vendorId -> Set of allowed category slugs
    const invalidVendorCategories = new Set(); // Set of "vendorId::catSlug" with any invalid/expired doc
    const verifiedVendorCategories = new Map(); // "vendorId::catSlug" -> count of verified docs

    allCategoryDocs.forEach(doc => {
        const vId = doc.vendor?.toString();
        const catSlug = doc.category_slug ? doc.category_slug.toLowerCase() : '';
        if (!vId || !catSlug) return;

        const vendorCatKey = `${vId}::${catSlug}`;

        // 1. Check if expired
        const isExpired = doc.expiry_date && new Date(doc.expiry_date) < now;
        // 2. Check if unverified (pending or rejected or missing URL)
        const isUnverified = doc.status !== VERIFICATION_STATUS.VERIFIED || !doc.url;

        if (isExpired || isUnverified) {
            invalidVendorCategories.add(vendorCatKey);
            return;
        }

        // Verified and unexpired document
        const count = verifiedVendorCategories.get(vendorCatKey) || 0;
        verifiedVendorCategories.set(vendorCatKey, count + 1);
    });

    // Populate permitted categories: ONLY if count >= 1 AND NOT in invalidVendorCategories
    for (const [vendorCatKey, count] of verifiedVendorCategories.entries()) {
        if (!invalidVendorCategories.has(vendorCatKey) && count > 0) {
            const [vId, catSlug] = vendorCatKey.split('::');
            let set = vendorCategoryMap.get(vId);
            if (!set) {
                set = new Set();
                vendorCategoryMap.set(vId, set);
            }
            set.add(catSlug);
        }
    }

    if (vendorCategoryMap.size === 0) return buildEmptyResult(isFlat, { sort, page, limit });

    // =========================================================================
    // STEP 3: Operational Closures Exclusion & Vendor KYC Verification
    // =========================================================================

    const closedVendorIdSet = new Set(activeClosures.map(c => c.vendor?.toString()).filter(Boolean));

    const eligibleVendorIdStrings = [];
    for (const id of vendorCategoryMap.keys()) if (!closedVendorIdSet.has(id)) eligibleVendorIdStrings.push(id);
    if (eligibleVendorIdStrings.length === 0) return buildEmptyResult(isFlat, { sort, page, limit });
    const eligibleVendorObjectIds = eligibleVendorIdStrings.map(id => new mongoose.Types.ObjectId(id));

    // Vendor Basic Status (active/operating/approved) + KYC (PAN/Aadhaar/Business Reg)
    const vendorQuery = { _id: { $in: eligibleVendorObjectIds }, ...MasterService.getVendorActiveMatchCriteria() };

    // =========================================================================
    // STEP 4: Dual Address Search Pre-Filter (Vendor Business Address + Package Address)
    // =========================================================================

    if (address && typeof address === 'string' && address.trim()) {
        const addrRegex = new RegExp(address.trim(), 'i');

        // Priority 1: Match directly on vendor registered business address
        const vendorAddressQuery = { _id: { $in: eligibleVendorObjectIds }, $or: [{ 'address.city': addrRegex }, { 'address.addressLine1': addrRegex }, { 'address.addressLine2': addrRegex }, { 'address.state': addrRegex }] };

        // Priority 2: Match on individual package item location fields
        const itemAddressQuery = [];
        for (const { name } of categories) {
            const key = schemaKey(name);
            itemAddressQuery.push({ [`${key}.location.address`]: addrRegex }, { [`${key}.location.city`]: addrRegex });
        }

        const [directVendorDocs, packageDocsWithMatchingAddress] = await Promise.all([
            getManyBy(Vendor, vendorAddressQuery, '_id'),
            getManyBy(Package, { vendor: { $in: eligibleVendorObjectIds }, $or: itemAddressQuery }, 'vendor')
        ]);

        const allMatchedVendorIds = Array.from(new Set([...directVendorDocs.map(v => v._id?.toString()), ...packageDocsWithMatchingAddress.map(p => p.vendor?.toString())])).filter(Boolean).map(id => new mongoose.Types.ObjectId(id));
        if (allMatchedVendorIds.length === 0) return buildEmptyResult(isFlat, { sort, page, limit });
        vendorQuery._id = { $in: allMatchedVendorIds };
    }

    // Fetch verified, compliant vendors with thin projection
    const validVendors = await getManyBy(Vendor, vendorQuery, '_id address');
    if (!validVendors || validVendors.length === 0) return buildEmptyResult(isFlat, { sort, page, limit });

    const validVendorMap = new Map(validVendors.map(v => [v._id.toString(), v]));
    const validVendorObjectIds = validVendors.map(v => v._id);

    // =========================================================================
    // STEP 5: Ultra-Fast Indexed Aggregation on Package Collection
    // (Zero $lookups for closures/vendors/documents — pure speed!)
    // =========================================================================

    const pipeline = [
        { $match: { vendor: { $in: validVendorObjectIds } } },
        {
            $project: {
                vendor: 1,
                items: {
                    $concatArrays: categories.map(({ name, slug, _id: catId }) => {
                        const key = schemaKey(name);
                        return {
                            $map: {
                                input: {
                                    $filter: {
                                        input: { $ifNull: [`$${key}`, []] },
                                        as: "subItem",
                                        cond: {
                                            $and: [
                                                { $eq: ["$$subItem.isActive", true] },
                                                {
                                                    $cond: {
                                                        if: { $gt: [minPrice, 0] },
                                                        then: { $gte: ["$$subItem.pricing.sellingPrice", minPrice] },
                                                        else: true
                                                    }
                                                },

                                                {
                                                    $cond: {
                                                        if: { $gt: [maxPrice, 0] },
                                                        then: { $lte: ["$$subItem.pricing.sellingPrice", maxPrice] },
                                                        else: true
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                },
                                as: "item",
                                in: {
                                    $mergeObjects: ["$$item", {
                                        catalog_id: "$_id",
                                        category_id: catId,
                                        category_name: name,
                                        category_slug: slug
                                    }]
                                }
                            }
                        };
                    })
                }
            }
        },
        {
            $unwind: "$items"
        }
    ];

    // Text / Keyword Search across item title, description & city
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

    // Reviews Lookup (Average Rating & Review Count)
    pipeline.push(itemsReviews());

    // Sorting (price_asc | price_desc | oldest | Newest | rating_asc | rating_desc | default - no sort)
    sortItems(pipeline, sort);

    // Wishlist Resolution (Authenticated Travellers)
    const hasUserId = itemsWishlist(pipeline, userId);

    // Final Project Stage
    pipeline.push(itemsProject(hasUserId));

    // =========================================================================
    // STEP 6: Execute Pipeline, Permitted Category Validation & Haversine Distance
    // =========================================================================

    const items = await Package.aggregate(pipeline);
    const { latitude, longitude, hasCoords } = normalizeCoordinates(lat, lng);
    const radiusKm = parseFloat(radius) || 50;

    const itemsByCategory = {};

    for (const item of items) {
        const vId = item.vendor?.toString();
        const catSlug = (item.category_slug || '').toLowerCase();

        // Permitted category validation (Strictly drops any non-permitted category)
        const allowedCategories = vendorCategoryMap.get(vId);
        if (!allowedCategories || !allowedCategories.has(catSlug)) continue;

        // Coordinate Fallback: Package item coordinates -> Vendor business address coordinates
        const vendor = validVendorMap.get(vId);
        const vendorCoords = vendor?.address?.location?.coordinates;
        const itemCoords = item.location?.coordinates;
        const hasVendorCoords = Array.isArray(vendorCoords) && (vendorCoords[0] !== 0 || vendorCoords[1] !== 0);
        const itemLng = hasVendorCoords ? vendorCoords[0] : itemCoords?.[0];
        const itemLat = hasVendorCoords ? vendorCoords[1] : itemCoords?.[1];

        // Haversine Distance Enforcement
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

        // Group into category dictionary
        if (!itemsByCategory[catSlug]) {
            itemsByCategory[catSlug] = [];
        }
        itemsByCategory[catSlug].push(item);
    }

    // =========================================================================
    // STEP 7: Output Structuring & Response Formatting
    // =========================================================================

    let result = {};
    let categorySpecificItems = [];
    for (const cat of categories) {
        const slug = (cat.slug || '').toLowerCase();
        const matchedItems = itemsByCategory[slug] || [];
        if (matchedItems.length === 0) continue;

        result[slug] = matchedItems.map(item => packageItemResponse(item, { name: cat.name, slug: cat.slug, id: cat._id }, item.rating, { wishlist: item.wishlist }));
    }

    let finalResult;
    if (isFlat) {
        const allItems = Object.values(result).flat();
        finalResult = paginateItems(allItems, options);
    } else {
        finalResult = {};
        for (const slug in result) {
            finalResult[slug] = paginateItems(result[slug], options);
        }
    }

    // LRU Cache Eviction & Storage
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

/**
 * Pure MongoDB Aggregation Pipeline to fetch a single package item subdocument.
 * Single database trip: Extracts subdocument, attaches category metadata,
 * populates vendor, and computes live reviews & ratings.
 *
 * @param {string|mongoose.Types.ObjectId} itemId - Package item subdocument _id
 * @returns {Promise<Object|null>} Populated item object or null
 */
export async function getPackageItemById(itemId, userId = null) {
    if (!itemId || !mongoose.Types.ObjectId.isValid(itemId)) return null;
    const targetId = new mongoose.Types.ObjectId(itemId);

    const categories = await getCategoriesBy({ isActive: true });
    if (!categories || categories.length === 0) return null;

    const config = await getAppConfig().catch(() => null);
    const serviceTax = config?.tax?.service_tax ?? 10;

    const hasUserId = Boolean(userId && mongoose.Types.ObjectId.isValid(userId));
    const userObjectId = hasUserId ? new mongoose.Types.ObjectId(userId) : null;

    const pipeline = [
        { $match: { $or: categories.map(cat => ({ [`${schemaKey(cat.name)}._id`]: targetId })) } },
        {
            $project: {
                vendor: 1,
                item: {
                    $concatArrays: categories.map(cat => {
                        const key = schemaKey(cat.name);
                        return {
                            $map: {
                                input: {
                                    $filter: {
                                        input: { $ifNull: [`$${key}`, []] },
                                        as: "sub",
                                        cond: { $eq: ["$$sub._id", targetId] }
                                    }
                                },
                                as: "item",
                                in: {
                                    $mergeObjects: [
                                        "$$item",
                                        {
                                            category_id: { $toString: cat._id },
                                            category_slug: cat.slug,
                                            category_name: cat.name,
                                        }
                                    ]
                                }
                            }
                        };
                    })
                }
            }
        },
        { $unwind: "$item" },
        {
            $lookup: {
                from: 'vendors',
                localField: 'vendor',
                foreignField: '_id',
                pipeline: [
                    {
                        $project: {
                            _id: 0,
                            id: { $toString: "$_id" },
                            ownerName: 1,
                            businessName: 1,
                            businessNumber: 1,
                            trustBadge: 1,
                            isOperating: 1,
                            isApproved: 1,
                            profileImage: 1,
                            address: "$address.addressLine1",
                            location: { $ifNull: ["$address.location.coordinates", []] },

                        }
                    }
                ],
                as: 'business'
            }
        },
        {
            $lookup: {
                from: 'reviews',
                let: { itemId: "$item._id" },
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
                    // Populate Reviewer User
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'user',
                            foreignField: '_id',
                            pipeline: [
                                {
                                    $project: {
                                        _id: 0,
                                        id: { $toString: "$_id" },
                                        name: 1,
                                        profileImage: 1,
                                    }
                                }
                            ],
                            as: 'userDetails'
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            id: { $toString: "$_id" },
                            rating: 1,
                            isVisible: 1,
                            user: { $arrayElemAt: ["$userDetails", 0] },
                            comment: 1,
                            createdAt: 1,
                            booking: { $toString: "$booking" }
                        }
                    }
                ],
                as: 'reviews'
            }
        },
        {
            $project: {
                _id: 0,
                item: 1,
                reviews: 1,
                business: 1
            }
        }
    ];
    const userIdExists = itemsWishlist(pipeline, userObjectId, "$item._id");
    pipeline.push({
        $project: {
            id: "$item._id",
            title: "$item.title",
            description: "$item.description",
            isActive: "$item.isActive",
            availability: "$item.availability",
            pricing: "$item.pricing",
            address: "$item.location.address",
            location: "$item.location.coordinates.coordinates",
            amenities: "$item.amenities",
            mealsIncluded: "$item.mealsIncluded",
            mealType: "$item.mealType",
            details: "$item.details",
            policies: "$item.policies",
            category_id: "$item.category_id",
            category_slug: "$item.category_slug",
            category_name: "$item.category_name",
            photos: "$item.photos",
            createdAt: "$item.createdAt",
            updatedAt: "$item.updatedAt",
            business: { $ifNull: [{ $arrayElemAt: ["$business", 0] }, null] },
            rating: {
                average: {
                    $cond: {
                        if: { $gt: [{ $size: "$reviews" }, 0] },
                        then: { $round: [{ $avg: "$reviews.rating" }, 1] },
                        else: 0
                    }
                },
                count: { $size: "$reviews" }
            },
            reviews: "$reviews",
            wishlist: userIdExists ? { $gt: [{ $size: { $ifNull: ["$userWishlist", []] } }, 0] } : { $literal: false }
        }
    })

    const results = await Package.aggregate(pipeline);
    return results[0] || null;
}

export default { getTestBrowsePackages, getPackageItemById };
