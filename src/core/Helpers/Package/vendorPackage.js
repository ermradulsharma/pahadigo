/**
 * @file vendorPackage.js
 * @module core/Helpers/vendorPackage
 * @description Unified, lightweight engine for retrieving, filtering, and formatting a vendor's package inventory.
 * Directly aligned with Vendor (VendorSchema) and Package (VendorPackageSchema) models.
 */
import mongoose from 'mongoose';
import { getPackageBy, getBusinessByUserId, getReviewsBy, getCategoryBySlug } from '@/core/Helpers/queryHelpers.js';
import { getLocationPoint } from '@/core/Helpers/addressHelper.js';
import { calculateDistanceKm } from '@/core/Services/Shared/PackageCore.js';
import { packageItemResponse } from './packageResponse.js';
import { paginateArray } from '../queryUtils.js';
import { schemaKey } from './shared.js';
import { Package } from '@/core/Models/index.js';

/**
 * Retrieves, filters, and formats a vendor's package catalog with search, price, geo, and pagination support.
 * Supports both flat paginated output and category-grouped dictionary output via `isFlat`.
 *
 * @async
 * @param {string} userId - Authenticated user's ObjectId
 * @param {number} [page=1] - 1-indexed page number
 * @param {number} [limit=10] - Items per page (0 returns all)
 * @param {number} [minPrice=0] - Minimum selling price filter
 * @param {number|null} [maxPrice=null] - Maximum selling price filter
 * @param {boolean} [isFlat=true] - Flat output format (true) or categorized dictionary (false)
 * @param {string} [sort=''] - Sort order ('price_asc' | 'price_desc' | 'oldest')
 * @param {string} [query=''] - Keyword search across title, address, and city
 * @param {string} [category=''] - Category filter (slug or key)
 * @param {number|null} [lat=null] - Latitude coordinate for geo-radius filter
 * @param {number|null} [lng=null] - Longitude coordinate for geo-radius filter
 * @param {number|null} [radius=null] - Distance radius in kilometers
 * @param {string} [address=''] - Location/city text filter
 *
 * @returns {Promise<{ items: Array<Object>, pagination: Object } | Object<string, Array<Object>>>}
 */
export async function getVendorPackages(options = {}) {
    const { userId, page = 1, limit = 10, minPrice = 0, maxPrice = null, format = 'grouped', sort = '', query = '', category = '', lat = null, lng = null, radius = null, address = '' } = options;

    let isFlat = true;
    if (format === 'grouped') isFlat = false;

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // 1. Resolve Vendor Profile
    const vendor = await getBusinessByUserId(userObjectId, 'category');
    if (!vendor) return isFlat ? paginateArray([], page, limit) : {};

    const vendorId = vendor._id.toString();
    const vendorCategories = (vendor?.category || []).map(({ name, slug, _id }) => ({ name, slug, id: _id.toString() }));

    // 2. Resolve Vendor Package Catalog & Reviews Concurrently
    const [catalog, reviews] = await Promise.all([
        getPackageBy({ user: userId, vendor: vendorId }),
        getReviewsBy({ vendor: vendor._id, isVisible: true }, 'item.itemId rating')
    ]);

    if (!catalog) return isFlat ? paginateArray([], page, limit) : {};

    // 3. Build Review Stats Lookup Map (O(1) in-memory lookup per item)
    const reviewStatsMap = new Map();
    if (Array.isArray(reviews)) {
        for (const rev of reviews) {
            const itemIdStr = rev.item?.itemId?.toString();
            if (!itemIdStr) continue;

            const stat = reviewStatsMap.get(itemIdStr) || { sum: 0, count: 0 };
            stat.sum += (Number(rev.rating) || 0);
            stat.count += 1;
            reviewStatsMap.set(itemIdStr, stat);
        }
    }

    const flatItems = [];
    const categorizedItems = {};

    // 3. Iterate authorized vendor categories and filter items
    for (const { name, slug, id } of vendorCategories) {
        const key = name === 'Bike/Scooter Rental' ? 'vehicleRental' : name.replace(/[^a-zA-Z0-9 ]/g, '').split(' ').filter(Boolean).map((word, index) => (index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())).join('');

        // Category filter: skip if category param is specified and doesn't match
        if (category && category !== 'all') {
            const filterCat = category.toLowerCase();
            if (slug.toLowerCase() !== filterCat && key.toLowerCase() !== filterCat && name.toLowerCase() !== filterCat) {
                continue;
            }
        }

        categorizedItems[slug] = [];
        const items = Array.isArray(catalog[key]) ? catalog[key] : [];

        for (const item of items) {
            const sellingPrice = item.pricing?.sellingPrice || item.pricing?.basePrice || 0;
            const itemTitle = (item.title || item.name || '').toLowerCase();
            const itemAddress = (item?.location?.address || item?.location?.city || '').toLowerCase();

            // Price range filter
            if (minPrice && sellingPrice < minPrice) continue;
            if (maxPrice && sellingPrice > maxPrice) continue;

            // Keyword search (query) across title and address/city
            if (query && !itemTitle.includes(query.toLowerCase()) && !itemAddress.includes(query.toLowerCase())) {
                continue;
            }

            // Address filter
            if (address && !itemAddress.includes(address.toLowerCase())) {
                continue;
            }

            // Geo distance and radius filter
            const coords = getLocationPoint(item?.location);
            if (lat && lng && coords && coords.length === 2) {
                const dist = calculateDistanceKm(lat, lng, coords[1], coords[0]);
                if (radius && dist !== null && dist > radius) {
                    continue;
                }
            }

            // Formatted vendor package item using shared helper
            const formattedItem = packageItemResponse(item, { name, slug, id }, reviewStatsMap);

            flatItems.push(formattedItem);
            categorizedItems[slug].push(formattedItem);
        }
    }

    // 4. Reusable Sorting and Pagination Engine
    const paginateAndSort = (itemsList = []) => {
        if (sort === 'price_asc') {
            itemsList.sort((a, b) => (a.pricing?.sellingPrice || 0) - (b.pricing?.sellingPrice || 0));
        } else if (sort === 'price_desc') {
            itemsList.sort((a, b) => (b.pricing?.sellingPrice || 0) - (a.pricing?.sellingPrice || 0));
        } else if (sort === 'oldest') {
            itemsList.sort((a, b) => (a.id || '').toString().localeCompare((b.id || '').toString()));
        } else {
            itemsList.sort((a, b) => (b.id || '').toString().localeCompare((a.id || '').toString()));
        }

        const total = itemsList.length;
        const totalPages = limit > 0 ? (Math.ceil(total / limit) || 0) : 1;
        const startIndex = (page - 1) * (limit || total);
        const paginatedItems = limit > 0 ? itemsList.slice(startIndex, startIndex + limit) : itemsList;

        return {
            items: paginatedItems,
            pagination: {
                total,
                page,
                limit: limit === 0 ? total : limit,
                totalPages
            }
        };
    };

    // 5. If isFlat is false, apply pagination & sorting inside each category
    if (!isFlat) {
        const finalResult = {};
        for (const slug in categorizedItems) {
            finalResult[slug] = paginateAndSort(categorizedItems[slug]);
        }
        return finalResult;
    }
    return paginateArray(flatItems, page, limit);
}

export async function getVendorPackageItemById(userId, category, itemId) {
    try {

        if (!itemId || !mongoose.Types.ObjectId.isValid(itemId)) return null;
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return null;
        if (!category || typeof category !== 'string') return null;

        const targetItemId = new mongoose.Types.ObjectId(itemId);
        const userObjectId = new mongoose.Types.ObjectId(userId);

        const catDoc = await getCategoryBySlug(category);
        if (!catDoc) return null;

        const sKey = schemaKey(catDoc.name);
        if (!sKey) return null;

        const pipeline = [
            { $match: { user: userObjectId, [`${sKey}._id`]: targetItemId } },
            {
                $project: {
                    vendor: 1,
                    user: 1,
                    item: {
                        $filter: {
                            input: { $ifNull: [`$${sKey}`, []] },
                            as: "sub",
                            cond: { $eq: ["$$sub._id", targetItemId] }
                        }
                    }
                }
            },
            { $unwind: "$item" },
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
                                            profileImage: 1
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
                                user: { $arrayElemAt: ["$userDetails", 0] },
                                comment: 1,
                                createdAt: 1,
                                isVisible: 1,
                                rating: 1
                            }
                        }
                    ],
                    as: 'reviews'
                }
            },
            {
                $replaceRoot: {
                    newRoot: {
                        $mergeObjects: [
                            "$item",
                            {
                                id: "$item._id",
                                address: { $ifNull: ["$item.location.address", ""] },
                                location: {
                                    $ifNull: [
                                        "$item.location.coordinates.coordinates",
                                        "$item.location.coordinates"
                                    ]
                                },
                                category_id: { $toString: catDoc._id },
                                category_slug: catDoc.slug,
                                category_name: catDoc.name,
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
                                reviews: "$reviews"
                            }
                        ]
                    }
                }
            },
            { $unset: "_id" }
        ];

        const results = await Package.aggregate(pipeline);
        return results[0] || null;

    } catch (error) {
        console.error('Error fetching vendor package item:', error);
        return null;
    }
}

export default { getVendorPackages, getVendorPackageItemById };
