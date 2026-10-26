/**
 * @file wishlistPackage.js
 * @module core/Helpers/Package/wishlistPackage
 * @description High-performance MongoDB Aggregation Pipeline engine for retrieving, filtering,
 * and formatting a traveller's wishlisted packages.
 * Executes single-pipeline joins across Wishlist, Package, Review, and Category collections.
 */

import mongoose from 'mongoose';
import Wishlist from '@/core/Models/Wishlist.js';
import Category from '@/core/Models/Category.js';
import { paginateArray } from '@/core/Helpers/queryUtils.js';
import { packageItemResponse } from './packageResponse.js';
import { normalizeCoordinates, calculateDistanceKm } from '@/core/Services/Shared/PackageCore.js';

let cachedCategories = null;
let lastCategoryFetch = 0;

/**
 * Maps Category Name/Slug to its corresponding Package array field name.
 * Package schema fields are camelCase versions of Category names:
 * e.g. 'Chardham Tour'       -> 'chardhamTour'
 *      'Bungee Jumping'      -> 'bungeeJumping'
 *      'Custom Trip'         -> 'customTrip'
 * Special case:
 *      'Bike/Scooter Rental' -> 'vehicleRental'
 * @param {string} name
 * @param {string} slug
 * @returns {string}
 */
function nameToPackageField(name = '', slug = '') {
    const cleanSlug = (slug || '').toLowerCase().trim();
    const cleanName = (name || '').trim();
    if (cleanSlug === 'bike-scooter-rental' || cleanName.toLowerCase() === 'bike/scooter rental') {
        return 'vehicleRental';
    }
    return cleanName
        .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
        .replace(/^[A-Z]/, chr => chr.toLowerCase());
}

/**
 * Dynamically fetches active categories from Category Model with caching
 * @returns {Promise<Array<Object>>}
 */
async function getActiveCategories() {
    const now = Date.now();
    if (cachedCategories && (now - lastCategoryFetch < 5 * 60 * 1000)) {
        return cachedCategories;
    }
    cachedCategories = await Category.find({ isActive: true }).lean();
    lastCategoryFetch = now;
    return cachedCategories;
}

/**
 * Retrieves, filters, and formats a traveller's wishlist package items via a single MongoDB Aggregation Pipeline.
 *
 * @async
 * @param {Object} options - Normalized query options from parseQuery
 * @param {string|mongoose.Types.ObjectId} options.userId - Authenticated user's ObjectId
 * @param {number} [options.page=1] - 1-indexed page number
 * @param {number} [options.limit=10] - Items per page (0 returns all)
 * @param {number} [options.minPrice=0] - Minimum selling price filter
 * @param {number|null} [options.maxPrice=null] - Maximum selling price filter
 * @param {boolean} [options.isFlat=true] - Flat output format (true) or categorized dictionary (false)
 * @param {string} [options.sort=''] - Sort order ('price_asc' | 'price_desc' | 'rating_desc' | 'oldest')
 * @param {string} [options.query=''] - Keyword search across title, description, address, city, category
 * @param {string} [options.category=''] - Category filter (slug or name)
 * @param {number|null} [options.lat=null] - Latitude coordinate for geo-radius filter
 * @param {number|null} [options.lng=null] - Longitude coordinate for geo-radius filter
 * @param {number|null} [options.radius=null] - Distance radius in kilometers
 * @param {string} [options.address=''] - Location/city text filter
 * 
 * @returns {Promise<{ items: Array<Object>, pagination: Object } | Object<string, Array<Object>>>}
 */
export async function getWishlistPackages(options = {}) {
    const { userId, page = 1, limit = 10, minPrice = 0, maxPrice = null, format = 'grouped', sort = '', query = '', category = '', lat = null, lng = null, radius = null, address = '' } = options;
    let isFlat = true;
    if (format === '' || format === 'grouped') isFlat = false;
    if (!userId) return isFlat ? paginateArray([], page, limit) : {};

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const categories = await getActiveCategories();

    const pipeline = [
        { $match: { user: userObjectId } },
        { $sort: { createdAt: (sort === 'oldest' ? 1 : -1) } },
        {
            $lookup: {
                from: 'packages',
                let: { targetItemId: '$itemId' },
                pipeline: [
                    {
                        $project: {
                            items: {
                                $concatArrays: categories.map(cat => {
                                    const packageField = nameToPackageField(cat.name, cat.slug);
                                    return {
                                        $map: {
                                            input: { $ifNull: [`$${packageField}`, []] },
                                            as: "item",
                                            in: {
                                                $mergeObjects: [
                                                    "$$item",
                                                    {
                                                        catalogId: "$_id",
                                                        category_slug: cat.slug,
                                                        category_name: cat.name,
                                                        category_id: cat._id.toString()
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
                    { $match: { $expr: { $eq: ["$items._id", "$$targetItemId"] } } },
                    { $limit: 1 }
                ],
                as: 'pkg'
            }
        },
        { $unwind: "$pkg" },
        {
            $lookup: {
                from: 'reviews',
                let: { itemId: '$pkg.items._id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $or: [
                                    { $eq: ["$item.itemId", "$$itemId"] },
                                    { $eq: ["$itemId", "$$itemId"] }
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
                as: 'reviewStats'
            }
        },
        {
            $project: {
                _id: "$pkg.items._id",
                id: "$pkg.items._id",
                title: "$pkg.items.title",
                isActive: "$pkg.items.isActive",
                pricing: "$pkg.items.pricing",
                address: "$pkg.items.location.address",
                location: "$pkg.items.location",
                photos: "$pkg.items.photos",
                category_slug: "$pkg.items.category_slug",
                category_name: "$pkg.items.category_name",
                category_id: "$pkg.items.category_id",
                rating: { $arrayElemAt: ["$reviewStats", 0] }
            }
        }
    ];

    // 1.7 Keyword / Text Filter stage
    if (query) {
        const qRegex = new RegExp(query.trim(), 'i');
        pipeline.push({
            $match: {
                $or: [
                    { title: qRegex },
                    { description: qRegex },
                    { address: qRegex },
                    { city: qRegex },
                    { category_name: qRegex }
                ]
            }
        });
    }

    // 1.8 Category Filter stage
    if (category) {
        const cleanCat = category.trim().toLowerCase();
        pipeline.push({
            $match: {
                $or: [
                    { category_slug: cleanCat },
                    { category_name: { $regex: new RegExp(`^${cleanCat}$`, 'i') } }
                ]
            }
        });
    }

    // 1.9 Selling Price Range Filter stage
    if (minPrice > 0 || (maxPrice !== null && maxPrice > 0)) {
        const priceFilter = {};
        if (minPrice > 0) priceFilter.$gte = minPrice;
        if (maxPrice !== null && maxPrice > 0) priceFilter.$lte = maxPrice;
        pipeline.push({ $match: { "pricing.sellingPrice": priceFilter } });
    }

    // 1.10 Location / City Text Filter stage
    if (address) {
        const aRegex = new RegExp(address.trim(), 'i');
        pipeline.push({
            $match: {
                $or: [
                    { address: aRegex },
                    { city: aRegex }
                ]
            }
        });
    }

    // 1.11 Price / Rating Sorting stage (createdAt is already sorted at stage 1)
    if (sort === 'price_asc') {
        pipeline.push({ $sort: { "pricing.sellingPrice": 1 } });
    } else if (sort === 'price_desc') {
        pipeline.push({ $sort: { "pricing.sellingPrice": -1 } });
    } else if (sort === 'rating_desc' || sort === 'top_rated') {
        pipeline.push({ $sort: { "rating.average": -1, "rating.count": -1 } });
    }

    // 2. Execute Pipeline
    let items = await Wishlist.aggregate(pipeline);

    // 2.1 Standardize package item response
    items = items.map(item => packageItemResponse(item, {}, item.rating, { wishlist: true }));

    // 3. Geo-Radius Haversine Filter
    const { latitude, longitude, hasCoords } = normalizeCoordinates(lat, lng);
    if (hasCoords && radius && radius > 0) {
        items = items.filter(item => {
            if (!Array.isArray(item.location) || item.location.length < 2) return false;
            const [itemLng, itemLat] = item.location;
            if ((itemLat === 0 && itemLng === 0) || isNaN(itemLat) || isNaN(itemLng)) return false;

            const dist = calculateDistanceKm(latitude, longitude, itemLat, itemLng);
            if (dist === null || isNaN(dist)) return false;

            item.distance = Math.round(dist * 10) / 10;
            return item.distance <= radius;
        });
    }

    // 4. Output Formatting
    if (!isFlat) {
        const categorizedResult = {};
        const categorySlugs = [...new Set(items.map(i => i.category_slug).filter(Boolean))];
        for (const slug of categorySlugs) {
            const catItems = items.filter(i => i.category_slug === slug);
            if (catItems.length > 0) {
                categorizedResult[slug] = paginateArray(catItems, page, limit);
            }
        }
        return categorizedResult;
    }

    return paginateArray(items, page, limit);
}

export default getWishlistPackages;
